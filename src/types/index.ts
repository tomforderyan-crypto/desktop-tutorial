export type Platform = 'youtube' | 'youtube_shorts' | 'instagram' | 'facebook' | 'x'

export type ContentFormat = 'short' | 'long'

export type RevenueSource = 'ad_revenue' | 'sponsorship' | 'affiliate' | 'merch' | 'other'

export type PostStatus = 'planned' | 'posted' | 'missed'

export const PLATFORMS: Platform[] = ['youtube', 'youtube_shorts', 'instagram', 'facebook', 'x']

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  youtube_shorts: 'YouTube Shorts',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
}

export const TOPICS = [
  'General Motorsport',
  'Formula 1',
  'Formula 2',
  'Formula 3',
  'MotoGP',
  'WRC / Rally',
  'NASCAR',
  'IndyCar',
  'Le Mans / WEC',
  'Karting',
  'Drifting',
  'Sim Racing',
] as const

export type Topic = (typeof TOPICS)[number]

export interface ContentIdea {
  id: string
  title: string
  hook: string
  description: string
  topic: Topic
  format: ContentFormat
  suggestedPlatforms: Platform[]
  inspiration?: string
  liked: boolean
  createdAt: string
}

export interface CalendarEntry {
  id: string
  ideaId?: string
  title: string
  description: string
  topic: Topic
  format: ContentFormat
  platform: Platform
  date: string
  time: string
  status: PostStatus
  hashtags: string[]
  caption: string
  createdAt: string
}

export interface AnalyticsSnapshot {
  id: string
  platform: Platform
  topic: Topic
  format: ContentFormat
  date: string
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeMinutes: number
  postHour: number
  calendarEntryId?: string
}

export interface RevenueEntry {
  id: string
  date: string
  amount: number
  source: RevenueSource
  platform: Platform
  topic: Topic
  format: ContentFormat
  postHour: number
  calendarEntryId?: string
  note?: string
}

export interface AppSettings {
  id: 'settings'
  creatorName: string
  monthlyIncomeGoal: number
  enabledPlatforms: Platform[]
  connectedPlatforms: Platform[]
  pushEnabled: boolean
  pushServerUrl: string
  onboardingComplete: boolean
}

export interface StreakLogEntry {
  id: string
  date: string
  posted: boolean
}

export interface CompetitorTrend {
  creator: string
  platform: Platform
  topic: Topic
  format: ContentFormat
  whyItWorks: string
}
