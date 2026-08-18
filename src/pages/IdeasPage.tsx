import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { generateIdeas } from '../lib/ideaGenerator'
import { generateCaption, generateHashtags } from '../lib/hashtags'
import { suggestPostTime } from '../lib/bestTime'
import { generateId } from '../lib/id'
import type { ContentIdea, Platform } from '../types'
import { PLATFORM_LABELS } from '../types'
import { Button, Card, EmptyState, Sheet, Select, SectionTitle, FormatPill } from '../components/ui'
import { BulbIcon, RefreshIcon, HeartIcon, SparklesIcon, HashIcon, ClockIcon } from '../components/icons'

export default function IdeasPage() {
  const settings = useSettings()
  const ideas =
    useLiveQuery(
      () => db.ideas.orderBy('createdAt').reverse().filter((i) => !i.liked).toArray(),
      [],
    ) ?? []
  const analyticsCount = useLiveQuery(() => db.analyticsSnapshots.count(), []) ?? 0
  const [loading, setLoading] = useState(false)
  const [activeIdea, setActiveIdea] = useState<ContentIdea | null>(null)
  const [schedulePlatform, setSchedulePlatform] = useState<Platform>('youtube_shorts')

  async function handleGenerate() {
    setLoading(true)
    try {
      const fresh = await generateIdeas(db, 6)
      await db.ideas.bulkAdd(fresh)
    } finally {
      setLoading(false)
    }
  }

  async function handleDismiss(idea: ContentIdea) {
    await db.ideas.delete(idea.id)
  }

  function platformOptions(idea: ContentIdea): Platform[] {
    const filtered = idea.suggestedPlatforms.filter((p) => settings.enabledPlatforms.includes(p))
    return filtered.length > 0 ? filtered : idea.suggestedPlatforms
  }

  async function openSchedule(idea: ContentIdea) {
    setActiveIdea(idea)
    setSchedulePlatform(platformOptions(idea)[0])
  }

  async function confirmSchedule() {
    if (!activeIdea) return
    const snapshots = await db.analyticsSnapshots.toArray()
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    const sameDay = await db.calendarEntries.where('date').equals(dateStr).toArray()
    const suggestion = suggestPostTime(
      snapshots,
      schedulePlatform,
      sameDay.map((e) => Number(e.time.split(':')[0])),
    )
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + 1)
    const targetDateStr = targetDate.toISOString().slice(0, 10)

    await db.transaction('rw', db.calendarEntries, db.ideas, async () => {
      await db.calendarEntries.add({
        id: generateId(),
        ideaId: activeIdea.id,
        title: activeIdea.title,
        description: activeIdea.description,
        topic: activeIdea.topic,
        format: activeIdea.format,
        platform: schedulePlatform,
        date: targetDateStr,
        time: `${String(suggestion.hour).padStart(2, '0')}:00`,
        status: 'planned',
        hashtags: generateHashtags(activeIdea.topic, schedulePlatform, activeIdea.format),
        caption: generateCaption(activeIdea.title, activeIdea.topic, schedulePlatform, activeIdea.format),
        createdAt: new Date().toISOString(),
      })
      await db.ideas.update(activeIdea.id, { liked: true })
    })
    setActiveIdea(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        title="Idea Generator"
        action={
          <Button onClick={handleGenerate} disabled={loading}>
            <span className="flex items-center gap-1.5">
              <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Generate
            </span>
          </Button>
        }
      />

      <p className="text-xs text-[var(--color-text-muted)]">
        {analyticsCount === 0
          ? 'Starting broad since you have no analytics yet — ideas span general motorsport topics.'
          : `Weighted toward what's performing best across ${analyticsCount} tracked posts, blended with what similar creators are seeing traction with.`}
      </p>

      {ideas.length === 0 ? (
        <EmptyState
          title="No ideas yet"
          body="Tap Generate to get a fresh batch of motorsport content ideas."
          action={
            <Button onClick={handleGenerate} disabled={loading} className="mt-2">
              Generate ideas
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onLike={() => openSchedule(idea)} onDismiss={() => handleDismiss(idea)} />
          ))}
        </div>
      )}

      <Sheet open={!!activeIdea} onClose={() => setActiveIdea(null)}>
        {activeIdea && (
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold">{activeIdea.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Send this to your calendar. We'll pick the best available time automatically.
            </p>
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Platform</label>
            <Select value={schedulePlatform} onChange={(e) => setSchedulePlatform(e.target.value as Platform)}>
              {platformOptions(activeIdea).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActiveIdea(null)}>
                Cancel
              </Button>
              <Button onClick={confirmSchedule}>Add to calendar</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function IdeaCard({ idea, onLike, onDismiss }: { idea: ContentIdea; onLike: () => void; onDismiss: () => void }) {
  const [showTags, setShowTags] = useState(false)
  const platform = idea.suggestedPlatforms[0]
  const hashtags = generateHashtags(idea.topic, platform, idea.format)
  const caption = generateCaption(idea.title, idea.topic, platform, idea.format)

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FormatPill format={idea.format} />
          <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{idea.topic}</span>
        </div>
        <button onClick={onDismiss} className="text-xs text-[var(--color-text-muted)]" aria-label="Dismiss idea">
          Skip
        </button>
      </div>

      <div className="flex items-start gap-2">
        <BulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-soft)]" />
        <div>
          <p className="font-semibold leading-snug">{idea.title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{idea.hook}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">{idea.description}</p>

      {idea.inspiration && (
        <div className="flex items-start gap-2 rounded-lg bg-[var(--color-surface-alt)] p-2 text-xs text-[var(--color-text-muted)]">
          <SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>{idea.inspiration}</span>
        </div>
      )}

      {showTags && (
        <div className="rounded-lg bg-[var(--color-surface-alt)] p-2 text-xs">
          <div className="mb-1 flex flex-wrap gap-1">
            {hashtags.map((tag) => (
              <span key={tag} className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[var(--color-accent-soft)]">
                {tag}
              </span>
            ))}
          </div>
          <p className="whitespace-pre-wrap text-[var(--color-text-muted)]">{caption}</p>
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <Button variant="secondary" onClick={() => setShowTags((v) => !v)} className="flex items-center gap-1.5">
          <HashIcon className="h-3.5 w-3.5" />
          {showTags ? 'Hide' : 'Caption & tags'}
        </Button>
        <Button onClick={onLike} className="ml-auto flex items-center gap-1.5">
          <HeartIcon className="h-4 w-4" />
          Like &amp; schedule
        </Button>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
        <ClockIcon className="h-3 w-3" />
        We'll suggest the best time once it's on your calendar.
      </div>
    </Card>
  )
}
