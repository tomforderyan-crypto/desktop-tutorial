import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import { useSettings } from '../hooks/useSettings'
import { computeStreakStats } from '../lib/streak'
import { totalRevenue } from '../lib/revenueInsights'
import { pushSubscriptionEndpoint, reportStreakStatus } from '../lib/push'
import { Button, Card, PlatformPill, FormatPill } from '../components/ui'
import { BellIcon, BulbIcon, CalendarIcon, DollarIcon, FlameIcon } from '../components/icons'
import { PLATFORM_LABELS } from '../types'

export default function DashboardPage() {
  const settings = useSettings()
  const entries = useLiveQuery(() => db.calendarEntries.toArray(), []) ?? []
  const revenueEntries = useLiveQuery(() => db.revenueEntries.toArray(), []) ?? []
  const stats = computeStreakStats(entries)

  const monthKey = new Date().toISOString().slice(0, 7)
  const monthTotal = totalRevenue(revenueEntries.filter((e) => e.date.startsWith(monthKey)))
  const goal = settings.monthlyIncomeGoal || 1
  const progress = Math.min(100, (monthTotal / goal) * 100)

  useEffect(() => {
    if (!settings.pushEnabled) return
    pushSubscriptionEndpoint().then((endpoint) => {
      if (!endpoint) return
      reportStreakStatus(settings.pushServerUrl, {
        endpoint,
        daysBehind: stats.daysBehind,
        currentStreak: stats.currentStreak,
        nextScheduled: stats.nextScheduled
          ? { date: stats.nextScheduled.date, time: stats.nextScheduled.time, title: stats.nextScheduled.title }
          : null,
      })
    })
    // Only re-report when the underlying schedule state actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pushEnabled, settings.pushServerUrl, stats.daysBehind, stats.currentStreak, stats.nextScheduled?.id])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-[var(--color-text-muted)]">Welcome back,</p>
        <h1 className="text-xl font-bold">{settings.creatorName}</h1>
      </div>

      {stats.daysBehind > 0 && (
        <Card className="border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10">
          <p className="text-sm font-semibold text-[var(--color-accent-soft)]">
            You're {stats.daysBehind} day{stats.daysBehind === 1 ? '' : 's'} behind your posting schedule.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Catch up by marking posts as posted, or jump into Ideas to queue something new.
          </p>
        </Card>
      )}

      {!settings.pushEnabled && (
        <Card className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 shrink-0 text-[var(--color-accent-soft)]" />
            <p className="text-xs text-[var(--color-text-muted)]">
              Enable push notifications to get streak nudges and posting reminders on your phone.
            </p>
          </div>
          <Link to="/settings">
            <Button variant="secondary" className="whitespace-nowrap">
              Enable
            </Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center gap-1 py-5">
          <FlameIcon className="h-6 w-6 text-orange-400" />
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">day streak</p>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-1 py-5">
          <DollarIcon className="h-6 w-6 text-emerald-400" />
          <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">of monthly goal</p>
        </Card>
      </div>

      <Card>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <CalendarIcon className="h-4 w-4" /> Next scheduled post
        </p>
        {stats.nextScheduled ? (
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <FormatPill format={stats.nextScheduled.format} />
              <PlatformPill platform={stats.nextScheduled.platform} />
            </div>
            <p className="font-medium">{stats.nextScheduled.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {stats.nextScheduled.date} at {stats.nextScheduled.time} on {PLATFORM_LABELS[stats.nextScheduled.platform]}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Nothing queued yet. Generate an idea and like it to schedule your next post.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/ideas">
          <Card className="flex flex-col items-center gap-2 py-6 text-center transition-colors active:bg-[var(--color-surface-alt)]">
            <BulbIcon className="h-6 w-6 text-[var(--color-accent-soft)]" />
            <p className="text-sm font-semibold">Get ideas</p>
          </Card>
        </Link>
        <Link to="/calendar">
          <Card className="flex flex-col items-center gap-2 py-6 text-center transition-colors active:bg-[var(--color-surface-alt)]">
            <CalendarIcon className="h-6 w-6 text-[var(--color-accent-soft)]" />
            <p className="text-sm font-semibold">View calendar</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
