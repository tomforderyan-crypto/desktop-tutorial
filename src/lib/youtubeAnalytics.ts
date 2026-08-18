import type { AnalyticsSnapshot, Topic } from '../types'

export interface YoutubeStatus {
  configured: boolean
  connected: boolean
  channelTitle?: string
  thumbnailUrl?: string | null
  connectedAt?: string
}

export interface YoutubeVideo {
  videoId: string
  title: string
  publishedAt: string
  durationSeconds: number
  views: number
  likes: number
  comments: number
  shares: number
  watchTimeMinutes: number
}

export interface YoutubeSyncResult {
  channel: { id: string; title: string; subscriberCount: number }
  videos: YoutubeVideo[]
}

function base(serverUrl: string) {
  return serverUrl.replace(/\/$/, '')
}

export async function getYoutubeStatus(serverUrl: string): Promise<YoutubeStatus> {
  const res = await fetch(`${base(serverUrl)}/api/youtube/status`)
  if (!res.ok) throw new Error('Could not reach push server for YouTube status')
  return res.json()
}

export function youtubeConnectUrl(serverUrl: string): string {
  return `${base(serverUrl)}/api/youtube/connect`
}

export async function disconnectYoutube(serverUrl: string): Promise<void> {
  await fetch(`${base(serverUrl)}/api/youtube/disconnect`, { method: 'POST' })
}

export async function syncYoutube(serverUrl: string): Promise<YoutubeSyncResult> {
  const res = await fetch(`${base(serverUrl)}/api/youtube/sync`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'YouTube sync failed')
  }
  return res.json()
}

// Shorts are capped at 3 minutes as of YouTube's current definition.
const SHORT_FORM_MAX_SECONDS = 180

const TOPIC_KEYWORDS: [Topic, RegExp][] = [
  ['Formula 1', /\bf1\b|formula ?1|formula one/i],
  ['Formula 2', /\bf2\b|formula ?2|formula two/i],
  ['Formula 3', /\bf3\b|formula ?3|formula three/i],
  ['MotoGP', /moto ?gp/i],
  ['WRC / Rally', /\bwrc\b|\brally\b/i],
  ['NASCAR', /nascar/i],
  ['IndyCar', /indy ?car|indy ?500/i],
  ['Le Mans / WEC', /le mans|\bwec\b|endurance racing/i],
  ['Karting', /karting|go-?kart/i],
  ['Drifting', /drift/i],
  ['Sim Racing', /sim racing|iracing|esports/i],
]

export function inferTopic(title: string): Topic {
  for (const [topic, pattern] of TOPIC_KEYWORDS) {
    if (pattern.test(title)) return topic
  }
  return 'General Motorsport'
}

export function videosToSnapshots(videos: YoutubeVideo[]): AnalyticsSnapshot[] {
  return videos.map((v) => {
    const published = new Date(v.publishedAt)
    const isShort = v.durationSeconds > 0 && v.durationSeconds <= SHORT_FORM_MAX_SECONDS
    return {
      id: `yt-${v.videoId}`,
      platform: isShort ? 'youtube_shorts' : 'youtube',
      topic: inferTopic(v.title),
      format: isShort ? 'short' : 'long',
      date: v.publishedAt.slice(0, 10),
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      watchTimeMinutes: v.watchTimeMinutes,
      // publishedAt is UTC; treated as a consistent bucket for best-time analysis
      // rather than a guaranteed local hour.
      postHour: published.getUTCHours(),
    }
  })
}
