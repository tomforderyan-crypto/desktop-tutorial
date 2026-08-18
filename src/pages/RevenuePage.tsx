import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { generateId } from '../lib/id'
import { breakdownByPlatform, breakdownBySource, computeTopEarningPatterns, totalRevenue } from '../lib/revenueInsights'
import { PLATFORMS, PLATFORM_LABELS, TOPICS, type ContentFormat, type Platform, type RevenueEntry, type RevenueSource, type Topic } from '../types'
import { Button, Card, EmptyState, Input, SectionTitle, Select, Sheet } from '../components/ui'
import { DollarIcon, SparklesIcon } from '../components/icons'

const SOURCE_LABELS: Record<RevenueSource, string> = {
  ad_revenue: 'Ad revenue',
  sponsorship: 'Sponsorship',
  affiliate: 'Affiliate',
  merch: 'Merch',
  other: 'Other',
}

const EMPTY_ENTRIES: RevenueEntry[] = []

export default function RevenuePage() {
  const settings = useSettings()
  const entries = useLiveQuery(() => db.revenueEntries.toArray(), []) ?? EMPTY_ENTRIES
  const [addOpen, setAddOpen] = useState(false)
  const [goalDraft, setGoalDraft] = useState(String(settings.monthlyIncomeGoal))

  const now = new Date()
  const monthKey = now.toISOString().slice(0, 7)
  const monthEntries = useMemo(() => entries.filter((e) => e.date.startsWith(monthKey)), [entries, monthKey])
  const monthTotal = totalRevenue(monthEntries)
  const goal = settings.monthlyIncomeGoal || 1
  const progress = Math.min(100, (monthTotal / goal) * 100)

  const platformBreakdown = breakdownByPlatform(entries)
  const sourceBreakdown = breakdownBySource(entries)
  const patterns = computeTopEarningPatterns(entries, 3)

  async function saveGoal() {
    const value = Number(goalDraft)
    if (!Number.isFinite(value) || value <= 0) return
    await updateSettings({ monthlyIncomeGoal: value })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title="Revenue"
        action={
          <Button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <DollarIcon className="h-4 w-4" /> Log income
          </Button>
        }
      />

      <Card>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold">${monthTotal.toFixed(0)}</p>
            <p className="text-xs text-[var(--color-text-muted)]">of ${goal.toFixed(0)} goal this month</p>
          </div>
          <p className="text-sm font-semibold text-[var(--color-accent-soft)]">{progress.toFixed(0)}%</p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
          <div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            className="max-w-[140px]"
          />
          <Button variant="secondary" onClick={saveGoal}>
            Update goal
          </Button>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState
          title="No revenue logged yet"
          body="Log income as it comes in to track it against your monthly goal and see what's really earning."
          action={
            <Button onClick={() => setAddOpen(true)} className="mt-2">
              Log income
            </Button>
          }
        />
      ) : (
        <>
          {patterns.length > 0 && (
            <Card>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <SparklesIcon className="h-4 w-4 text-amber-400" /> Why this is working
              </p>
              <div className="flex flex-col gap-2">
                {patterns.map((p) => (
                  <p key={`${p.platform}-${p.topic}-${p.format}-${p.hour}`} className="text-sm text-[var(--color-text-muted)]">
                    {p.sentence}
                  </p>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-3 text-sm font-semibold">By platform</p>
            <div className="flex flex-col gap-2">
              {platformBreakdown.map((b) => (
                <BreakdownRow key={b.platform} label={PLATFORM_LABELS[b.platform]} total={b.total} percent={b.percent} />
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold">By source</p>
            <div className="flex flex-col gap-2">
              {sourceBreakdown.map((b) => (
                <BreakdownRow key={b.source} label={SOURCE_LABELS[b.source]} total={b.total} percent={b.percent} />
              ))}
            </div>
          </Card>
        </>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <AddRevenueForm onDone={() => setAddOpen(false)} />
      </Sheet>
    </div>
  )
}

function BreakdownRow({ label, total, percent }: { label: string; total: number; percent: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">${total.toFixed(0)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function AddRevenueForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState<RevenueSource>('ad_revenue')
  const [platform, setPlatform] = useState<Platform>(PLATFORMS[0])
  const [topic, setTopic] = useState<Topic>(TOPICS[0])
  const [format_, setFormat] = useState<ContentFormat>('short')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [hour, setHour] = useState('15')

  async function submit() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    await db.revenueEntries.add({
      id: generateId(),
      date,
      amount: value,
      source,
      platform,
      topic,
      format: format_,
      postHour: Number(hour),
    })
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">Log income</h3>
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Amount (USD)</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Source</label>
          <Select value={source} onChange={(e) => setSource(e.target.value as RevenueSource)} className="mt-1">
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Platform</label>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="mt-1">
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Topic</label>
          <Select value={topic} onChange={(e) => setTopic(e.target.value as Topic)} className="mt-1">
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Format</label>
          <Select value={format_} onChange={(e) => setFormat(e.target.value as ContentFormat)} className="mt-1">
            <option value="short">Short-form</option>
            <option value="long">Long-form</option>
          </Select>
        </div>
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
          <label className="text-xs font-medium text-[var(--color-text-muted)]">Post hour</label>
          <input
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit}>Save</Button>
      </div>
    </div>
  )
}
