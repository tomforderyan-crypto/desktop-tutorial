import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { db } from '../db/db'
import type { CalendarEntry, Platform, PostStatus } from '../types'
import { PLATFORM_LABELS } from '../types'
import { Button, Card, EmptyState, FormatPill, PlatformPill, SectionTitle, Select, Sheet } from '../components/ui'
import { CalendarIcon, CheckIcon, ClockIcon, HashIcon, XIcon } from '../components/icons'

const EMPTY_ENTRIES: CalendarEntry[] = []

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [editEntry, setEditEntry] = useState<CalendarEntry | null>(null)

  const entries = useLiveQuery(() => db.calendarEntries.toArray(), []) ?? EMPTY_ENTRIES

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const e of entries) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time))
    return map
  }, [entries])

  const selectedEntries = entriesByDate.get(selectedDate) ?? []

  async function setStatus(entry: CalendarEntry, status: PostStatus) {
    await db.calendarEntries.update(entry.id, { status })
  }

  async function deleteEntry(entry: CalendarEntry) {
    await db.calendarEntries.delete(entry.id)
    setEditEntry(null)
  }

  async function saveEdit(entry: CalendarEntry, patch: Partial<CalendarEntry>) {
    await db.calendarEntries.update(entry.id, patch)
    setEditEntry(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        title="Content Calendar"
        action={
          <div className="flex items-center gap-2 text-sm">
            <Button variant="secondary" onClick={() => setCursor((c) => subMonths(c, 1))}>
              ←
            </Button>
            <span className="w-28 text-center font-medium">{format(cursor, 'MMMM yyyy')}</span>
            <Button variant="secondary" onClick={() => setCursor((c) => addMonths(c, 1))}>
              →
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Short-form
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Long-form
        </span>
      </div>

      <Card className="p-2">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--color-text-muted)]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayEntries = entriesByDate.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const selected = key === selectedDate
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-lg pt-1 text-xs transition-colors ${
                  selected
                    ? 'bg-[var(--color-accent)] text-white'
                    : isToday(day)
                      ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)] ring-1 ring-[var(--color-accent)]/50'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                } ${!inMonth ? 'opacity-30' : ''}`}
              >
                {format(day, 'd')}
                <span className="flex gap-0.5">
                  {dayEntries.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        e.status === 'missed'
                          ? 'bg-red-400'
                          : e.format === 'short'
                            ? 'bg-emerald-400'
                            : 'bg-blue-400'
                      } ${selected ? 'opacity-90' : ''}`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-muted)]">
          {format(new Date(selectedDate), 'EEEE, MMM d')}
        </h3>
        {selectedEntries.length === 0 ? (
          <EmptyState title="Nothing scheduled" body="Like an idea from the generator to send it here." />
        ) : (
          <div className="flex flex-col gap-3">
            {selectedEntries.map((entry) => (
              <Card key={entry.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <FormatPill format={entry.format} />
                    <PlatformPill platform={entry.platform} />
                    <StatusPill status={entry.status} />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-soft)]">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {formatTime(entry.time)}
                  </span>
                </div>
                <p className="font-semibold leading-snug">{entry.title}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{entry.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {entry.status !== 'posted' && (
                    <Button variant="secondary" onClick={() => setStatus(entry, 'posted')} className="flex items-center gap-1.5">
                      <CheckIcon className="h-3.5 w-3.5" /> Mark posted
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setEditEntry(entry)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => deleteEntry(entry)} className="flex items-center gap-1.5 text-red-400">
                    <XIcon className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!editEntry} onClose={() => setEditEntry(null)}>
        {editEntry && <EditForm entry={editEntry} onCancel={() => setEditEntry(null)} onSave={saveEdit} />}
      </Sheet>
    </div>
  )
}

function StatusPill({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, string> = {
    planned: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]',
    posted: 'bg-emerald-500/15 text-emerald-400',
    missed: 'bg-red-500/15 text-red-400',
  }
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status]}`}>{status}</span>
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

function EditForm({
  entry,
  onCancel,
  onSave,
}: {
  entry: CalendarEntry
  onCancel: () => void
  onSave: (entry: CalendarEntry, patch: Partial<CalendarEntry>) => void
}) {
  const [date, setDate] = useState(entry.date)
  const [time, setTime] = useState(entry.time)
  const [platform, setPlatform] = useState<Platform>(entry.platform)
  const [showCaption, setShowCaption] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <CalendarIcon className="h-4 w-4" /> Edit post
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Platform</label>
        <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="mt-1">
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <button
        onClick={() => setShowCaption((v) => !v)}
        className="flex items-center gap-1.5 text-left text-xs font-medium text-[var(--color-text-muted)]"
      >
        <HashIcon className="h-3.5 w-3.5" /> {showCaption ? 'Hide caption & tags' : 'View caption & tags'}
      </button>
      {showCaption && (
        <div className="rounded-lg bg-[var(--color-surface-alt)] p-2 text-xs">
          <div className="mb-1 flex flex-wrap gap-1">
            {entry.hashtags.map((tag) => (
              <span key={tag} className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[var(--color-accent-soft)]">
                {tag}
              </span>
            ))}
          </div>
          <p className="whitespace-pre-wrap text-[var(--color-text-muted)]">{entry.caption}</p>
        </div>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(entry, { date, time, platform })}>Save</Button>
      </div>
    </div>
  )
}
