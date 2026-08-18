import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { computeStreakStats } from '../lib/streak'
import { FlameIcon } from './icons'

export default function StreakBadge() {
  const entries = useLiveQuery(() => db.calendarEntries.toArray(), []) ?? []
  const stats = computeStreakStats(entries)

  const behind = stats.daysBehind > 0

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        behind
          ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent-soft)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)]'
      }`}
      title={behind ? `${stats.daysBehind} day(s) behind schedule` : 'On track'}
    >
      <FlameIcon className={`h-3.5 w-3.5 ${behind ? '' : 'text-orange-400'}`} />
      {stats.currentStreak}
    </div>
  )
}
