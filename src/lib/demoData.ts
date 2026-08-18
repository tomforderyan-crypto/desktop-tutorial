import { addDays, format, subDays } from 'date-fns'
import type { db } from '../db/db'
import { TOPICS, type AnalyticsSnapshot, type CalendarEntry, type ContentFormat, type Platform, type RevenueEntry, type RevenueSource, type Topic } from '../types'
import { generateId } from './id'
import { generateCaption, generateHashtags } from './hashtags'

const REVENUE_SOURCES: RevenueSource[] = ['ad_revenue', 'sponsorship', 'affiliate', 'merch', 'other']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function skewedTopic(): Topic {
  // Bias demo data toward F1/F2 so the weighting + insights features have something to show.
  const roll = Math.random()
  if (roll < 0.4) return 'Formula 1'
  if (roll < 0.55) return 'Formula 2'
  return pick(TOPICS)
}

export async function seedDemoData(database: typeof db) {
  const today = new Date()
  const calendarEntries: CalendarEntry[] = []
  const analyticsSnapshots: AnalyticsSnapshot[] = []
  const revenueEntries: RevenueEntry[] = []

  for (let i = 45; i >= 1; i--) {
    const date = subDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const postsToday = Math.random() < 0.75 ? 1 : Math.random() < 0.5 ? 2 : 0
    for (let p = 0; p < postsToday; p++) {
      const topic = skewedTopic()
      const format_: ContentFormat = Math.random() < 0.65 ? 'short' : 'long'
      const platform: Platform = format_ === 'short' ? pick(['youtube_shorts', 'instagram', 'x', 'facebook']) : pick(['youtube', 'facebook'])
      const hour = format_ === 'short' ? pick([12, 15, 17, 19, 20]) : pick([9, 14, 18])
      const posted = Math.random() < 0.85
      const id = generateId()

      const entry: CalendarEntry = {
        id,
        title: `${topic} ${format_ === 'short' ? 'short' : 'deep dive'} — day ${45 - i}`,
        description: `Auto-generated demo post about ${topic}.`,
        topic,
        format: format_,
        platform,
        date: dateStr,
        time: `${String(hour).padStart(2, '0')}:00`,
        status: posted ? 'posted' : 'missed',
        hashtags: generateHashtags(topic, platform, format_),
        caption: generateCaption(`${topic} content`, topic, platform, format_),
        createdAt: date.toISOString(),
      }
      calendarEntries.push(entry)

      if (posted) {
        const boost = topic === 'Formula 1' || topic === 'Formula 2' ? 2.2 : 1
        const views = Math.round((Math.random() * 4000 + 200) * boost)
        const likes = Math.round(views * (0.03 + Math.random() * 0.05))
        const comments = Math.round(views * (0.002 + Math.random() * 0.01))
        const shares = Math.round(views * (0.001 + Math.random() * 0.008))

        analyticsSnapshots.push({
          id: generateId(),
          platform,
          topic,
          format: format_,
          date: dateStr,
          views,
          likes,
          comments,
          shares,
          watchTimeMinutes: Math.round(views * (format_ === 'short' ? 0.15 : 1.8)),
          postHour: hour,
          calendarEntryId: id,
        })

        if (Math.random() < 0.4) {
          const source = pick(REVENUE_SOURCES)
          const amount = Math.round((views / 1000) * (5 + Math.random() * 15) * boost * 10) / 10
          revenueEntries.push({
            id: generateId(),
            date: dateStr,
            amount,
            source,
            platform,
            topic,
            format: format_,
            postHour: hour,
            calendarEntryId: id,
          })
        }
      }
    }
  }

  for (let i = 0; i <= 6; i++) {
    const date = addDays(today, i)
    if (Math.random() < 0.7) {
      const topic = skewedTopic()
      const format_: ContentFormat = Math.random() < 0.65 ? 'short' : 'long'
      const platform: Platform = format_ === 'short' ? pick(['youtube_shorts', 'instagram', 'x', 'facebook']) : pick(['youtube', 'facebook'])
      const hour = format_ === 'short' ? pick([12, 15, 17, 19, 20]) : pick([9, 14, 18])
      calendarEntries.push({
        id: generateId(),
        title: `${topic} ${format_ === 'short' ? 'short' : 'deep dive'} — upcoming`,
        description: `Auto-generated demo post about ${topic}.`,
        topic,
        format: format_,
        platform,
        date: format(date, 'yyyy-MM-dd'),
        time: `${String(hour).padStart(2, '0')}:00`,
        status: 'planned',
        hashtags: generateHashtags(topic, platform, format_),
        caption: generateCaption(`${topic} content`, topic, platform, format_),
        createdAt: new Date().toISOString(),
      })
    }
  }

  await database.transaction('rw', database.calendarEntries, database.analyticsSnapshots, database.revenueEntries, async () => {
    await database.calendarEntries.bulkAdd(calendarEntries)
    await database.analyticsSnapshots.bulkAdd(analyticsSnapshots)
    await database.revenueEntries.bulkAdd(revenueEntries)
  })

  return { calendarEntries: calendarEntries.length, analyticsSnapshots: analyticsSnapshots.length, revenueEntries: revenueEntries.length }
}

export async function clearAllData(database: typeof db) {
  await database.transaction(
    'rw',
    database.ideas,
    database.calendarEntries,
    database.analyticsSnapshots,
    database.revenueEntries,
    database.streakLog,
    async () => {
      await Promise.all([
        database.ideas.clear(),
        database.calendarEntries.clear(),
        database.analyticsSnapshots.clear(),
        database.revenueEntries.clear(),
        database.streakLog.clear(),
      ])
    },
  )
}
