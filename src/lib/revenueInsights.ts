import type { ContentFormat, Platform, RevenueEntry, RevenueSource, Topic } from '../types'
import { PLATFORM_LABELS } from '../types'

function hourLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:00 ${period}`
}

export interface PlatformBreakdown {
  platform: Platform
  total: number
  percent: number
}

export interface SourceBreakdown {
  source: RevenueSource
  total: number
  percent: number
}

export interface EarningPattern {
  platform: Platform
  topic: Topic
  format: ContentFormat
  hour: number
  hourLabel: string
  total: number
  entryCount: number
  percentOfTotal: number
  sentence: string
}

export function totalRevenue(entries: RevenueEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0)
}

export function breakdownByPlatform(entries: RevenueEntry[]): PlatformBreakdown[] {
  const total = totalRevenue(entries)
  const map = new Map<Platform, number>()
  for (const e of entries) map.set(e.platform, (map.get(e.platform) ?? 0) + e.amount)
  return Array.from(map.entries())
    .map(([platform, sum]) => ({ platform, total: sum, percent: total ? (sum / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

export function breakdownBySource(entries: RevenueEntry[]): SourceBreakdown[] {
  const total = totalRevenue(entries)
  const map = new Map<RevenueSource, number>()
  for (const e of entries) map.set(e.source, (map.get(e.source) ?? 0) + e.amount)
  return Array.from(map.entries())
    .map(([source, sum]) => ({ source, total: sum, percent: total ? (sum / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

const MIN_ENTRIES_FOR_PATTERN = 2

export function computeTopEarningPatterns(entries: RevenueEntry[], topN = 3): EarningPattern[] {
  const total = totalRevenue(entries)
  if (total === 0) return []

  const groups = new Map<string, { platform: Platform; topic: Topic; format: ContentFormat; hour: number; total: number; count: number }>()
  for (const e of entries) {
    const key = `${e.platform}|${e.topic}|${e.format}|${e.postHour}`
    const g = groups.get(key) ?? { platform: e.platform, topic: e.topic, format: e.format, hour: e.postHour, total: 0, count: 0 }
    g.total += e.amount
    g.count += 1
    groups.set(key, g)
  }

  return Array.from(groups.values())
    .filter((g) => g.count >= MIN_ENTRIES_FOR_PATTERN)
    .sort((a, b) => b.total - a.total)
    .slice(0, topN)
    .map((g) => {
      const percentOfTotal = (g.total / total) * 100
      const formatLabel = g.format === 'short' ? 'short-form' : 'long-form'
      const sentence = `Your ${g.topic} ${formatLabel} posts around ${hourLabel(g.hour)} on ${PLATFORM_LABELS[g.platform]} are punching above the rest — $${g.total.toFixed(0)} (${percentOfTotal.toFixed(0)}% of tracked revenue) from ${g.count} posts.`
      return {
        platform: g.platform,
        topic: g.topic,
        format: g.format,
        hour: g.hour,
        hourLabel: hourLabel(g.hour),
        total: g.total,
        entryCount: g.count,
        percentOfTotal,
        sentence,
      }
    })
}
