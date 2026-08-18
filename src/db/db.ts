import Dexie, { type EntityTable } from 'dexie'
import type {
  ContentIdea,
  CalendarEntry,
  AnalyticsSnapshot,
  RevenueEntry,
  AppSettings,
  StreakLogEntry,
} from '../types'

export class PitLaneDB extends Dexie {
  ideas!: EntityTable<ContentIdea, 'id'>
  calendarEntries!: EntityTable<CalendarEntry, 'id'>
  analyticsSnapshots!: EntityTable<AnalyticsSnapshot, 'id'>
  revenueEntries!: EntityTable<RevenueEntry, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  streakLog!: EntityTable<StreakLogEntry, 'id'>

  constructor() {
    super('pit-lane-db')
    this.version(1).stores({
      ideas: 'id, topic, format, liked, createdAt',
      calendarEntries: 'id, date, platform, format, status, ideaId',
      analyticsSnapshots: 'id, platform, topic, format, date, calendarEntryId',
      revenueEntries: 'id, date, source, platform, topic, calendarEntryId',
      settings: 'id',
      streakLog: 'id, date',
    })
  }
}

export const db = new PitLaneDB()
