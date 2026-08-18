import type { AnalyticsSnapshot, Platform } from '../types'

// Placeholder audience-activity curves (0-23h, local time), used until real
// analytics history is available per platform. Swap for real API data by
// replacing MOCK_ACTIVITY with values pulled from each platform's insights
// endpoint once accounts are connected — see AnalyticsSnapshot aggregation
// below, which already takes over automatically once enough data exists.
const MOCK_ACTIVITY: Record<Platform, number[]> = {
  youtube: [2, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 8, 9, 10, 10, 9, 8, 6, 4, 3],
  youtube_shorts: [3, 2, 1, 1, 1, 2, 4, 6, 7, 7, 6, 7, 8, 8, 9, 10, 10, 9, 8, 7, 6, 5, 4, 3],
  instagram: [2, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 7, 8, 9, 10, 10, 9, 7, 5, 3],
  facebook: [3, 2, 1, 1, 1, 1, 2, 3, 5, 6, 7, 8, 9, 9, 8, 7, 7, 8, 9, 9, 8, 6, 5, 4],
  x: [4, 3, 2, 1, 1, 2, 3, 5, 7, 8, 8, 7, 6, 6, 7, 8, 8, 7, 7, 8, 7, 6, 5, 4],
}

export interface TimeWindow {
  hour: number
  label: string
  score: number
}

function hourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:00 ${period}`
}

export function bestWindowsFromMock(platform: Platform, topN = 3): TimeWindow[] {
  const activity = MOCK_ACTIVITY[platform]
  return activity
    .map((score, hour) => ({ hour, label: hourLabel(hour), score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

const MIN_SNAPSHOTS_FOR_REAL_DATA = 8

export function bestWindowsFromAnalytics(
  snapshots: AnalyticsSnapshot[],
  platform: Platform,
  topN = 3,
): TimeWindow[] | null {
  const relevant = snapshots.filter((s) => s.platform === platform)
  if (relevant.length < MIN_SNAPSHOTS_FOR_REAL_DATA) return null

  const buckets = new Map<number, { score: number; count: number }>()
  for (const s of relevant) {
    const engagement = s.views + s.likes * 3 + s.comments * 5 + s.shares * 4
    const bucket = buckets.get(s.postHour) ?? { score: 0, count: 0 }
    bucket.score += engagement
    bucket.count += 1
    buckets.set(s.postHour, bucket)
  }

  return Array.from(buckets.entries())
    .map(([hour, v]) => ({ hour, label: hourLabel(hour), score: Math.round(v.score / v.count) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

export function getBestWindows(
  snapshots: AnalyticsSnapshot[],
  platform: Platform,
  topN = 3,
): { windows: TimeWindow[]; source: 'live-analytics' | 'baseline-estimate' } {
  const fromAnalytics = bestWindowsFromAnalytics(snapshots, platform, topN)
  if (fromAnalytics) return { windows: fromAnalytics, source: 'live-analytics' }
  return { windows: bestWindowsFromMock(platform, topN), source: 'baseline-estimate' }
}

export function suggestPostTime(
  snapshots: AnalyticsSnapshot[],
  platform: Platform,
  usedHoursOnDate: number[] = [],
): { hour: number; label: string } {
  const { windows } = getBestWindows(snapshots, platform, 6)
  const free = windows.find((w) => !usedHoursOnDate.includes(w.hour))
  const chosen = free ?? windows[0]
  return { hour: chosen.hour, label: chosen.label }
}
