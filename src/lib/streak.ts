import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import type { CalendarEntry } from '../types'

export interface StreakStats {
  currentStreak: number
  daysBehind: number
  missedDates: string[]
  nextScheduled: CalendarEntry | null
}

export function computeStreakStats(entries: CalendarEntry[], asOf = new Date()): StreakStats {
  const todayStr = format(asOf, 'yyyy-MM-dd')
  const byDate = new Map<string, CalendarEntry[]>()
  for (const e of entries) {
    const list = byDate.get(e.date) ?? []
    list.push(e)
    byDate.set(e.date, list)
  }

  const pastDates = Array.from(byDate.keys())
    .filter((d) => d < todayStr)
    .sort()

  let daysBehind = 0
  const missedDates: string[] = []
  for (const date of pastDates) {
    const dayEntries = byDate.get(date)!
    const anyPosted = dayEntries.some((e) => e.status === 'posted')
    if (!anyPosted) {
      daysBehind += 1
      missedDates.push(date)
    }
  }

  let currentStreak = 0
  for (let i = pastDates.length - 1; i >= 0; i--) {
    const date = pastDates[i]
    const anyPosted = byDate.get(date)!.some((e) => e.status === 'posted')
    if (anyPosted) currentStreak += 1
    else break
  }

  const todayEntries = byDate.get(todayStr) ?? []
  if (todayEntries.some((e) => e.status === 'posted')) currentStreak += 1

  const upcoming = entries
    .filter((e) => e.status === 'planned' && e.date >= todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return {
    currentStreak,
    daysBehind,
    missedDates,
    nextScheduled: upcoming[0] ?? null,
  }
}

export function daysSince(dateIso: string, asOf = new Date()): number {
  return differenceInCalendarDays(asOf, parseISO(dateIso))
}
