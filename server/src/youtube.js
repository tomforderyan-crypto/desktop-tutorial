import { google } from 'googleapis'
import { getYoutubeAccount, setYoutubeAccount, clearYoutubeAccount } from './youtubeStore.js'

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
]

function redirectUri() {
  // Render sets this automatically for every deployed service; fall back to
  // an explicit env var for local dev against a tunnel, or localhost.
  const base = process.env.GOOGLE_REDIRECT_BASE || process.env.RENDER_EXTERNAL_URL || 'http://localhost:8787'
  return `${base.replace(/\/$/, '')}/api/youtube/oauth/callback`
}

function buildOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured on the server')
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri())
}

export function isYoutubeConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function getAuthUrl() {
  const client = buildOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // ensures a refresh_token is returned even on reconnect
    scope: SCOPES,
  })
}

async function getAuthorizedClient() {
  const account = getYoutubeAccount()
  if (!account) return null

  const client = buildOAuthClient()
  client.setCredentials(account.tokens)

  // googleapis refreshes access tokens transparently when they're expired;
  // persist whatever it hands back so the next server start still has it.
  client.on('tokens', (tokens) => {
    const current = getYoutubeAccount()
    if (!current) return
    setYoutubeAccount({ ...current, tokens: { ...current.tokens, ...tokens } })
  })

  return client
}

export async function handleOAuthCallback(code) {
  const client = buildOAuthClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  const youtube = google.youtube({ version: 'v3', auth: client })
  const { data } = await youtube.channels.list({ part: ['snippet', 'statistics'], mine: true })
  const channel = data.items?.[0]
  if (!channel) throw new Error('No YouTube channel found on this Google account')

  setYoutubeAccount({
    tokens,
    channelId: channel.id,
    channelTitle: channel.snippet?.title ?? 'YouTube channel',
    thumbnailUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    connectedAt: new Date().toISOString(),
  })

  return { channelTitle: channel.snippet?.title }
}

export function getStatus() {
  const account = getYoutubeAccount()
  if (!account) return { connected: false }
  return {
    connected: true,
    channelTitle: account.channelTitle,
    thumbnailUrl: account.thumbnailUrl,
    connectedAt: account.connectedAt,
  }
}

export function disconnect() {
  clearYoutubeAccount()
}

// "PT4M13S" -> 253 (seconds)
function parseIsoDuration(iso) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '')
  if (!match) return 0
  const [, h, m, s] = match
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
}

export async function fetchChannelAnalytics() {
  const client = await getAuthorizedClient()
  if (!client) throw new Error('YouTube is not connected')

  const account = getYoutubeAccount()
  const youtube = google.youtube({ version: 'v3', auth: client })
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: client })

  const { data: channelData } = await youtube.channels.list({
    part: ['contentDetails', 'statistics'],
    mine: true,
  })
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsPlaylistId) {
    return { channel: { id: account.channelId, title: account.channelTitle, subscriberCount: 0 }, videos: [] }
  }

  const { data: playlistData } = await youtube.playlistItems.list({
    part: ['contentDetails'],
    playlistId: uploadsPlaylistId,
    maxResults: 50,
  })
  const videoIds = (playlistData.items ?? []).map((item) => item.contentDetails.videoId).filter(Boolean)
  if (videoIds.length === 0) {
    return { channel: { id: account.channelId, title: account.channelTitle, subscriberCount: 0 }, videos: [] }
  }

  const { data: videosData } = await youtube.videos.list({
    part: ['snippet', 'contentDetails'],
    id: videoIds,
  })

  const { data: analyticsData } = await youtubeAnalytics.reports.query({
    ids: 'channel==MINE',
    startDate: '2005-01-01',
    endDate: new Date().toISOString().slice(0, 10),
    metrics: 'views,likes,comments,shares,estimatedMinutesWatched',
    dimensions: 'video',
    sort: '-views',
    maxResults: 50,
  })

  const metricNames = (analyticsData.columnHeaders ?? []).map((h) => h.name)
  const analyticsByVideo = new Map()
  for (const row of analyticsData.rows ?? []) {
    const record = Object.fromEntries(metricNames.map((name, i) => [name, row[i]]))
    analyticsByVideo.set(record.video, record)
  }

  const videos = (videosData.items ?? []).map((v) => {
    const stats = analyticsByVideo.get(v.id) ?? {}
    return {
      videoId: v.id,
      title: v.snippet?.title ?? 'Untitled',
      publishedAt: v.snippet?.publishedAt,
      durationSeconds: parseIsoDuration(v.contentDetails?.duration),
      views: stats.views ?? 0,
      likes: stats.likes ?? 0,
      comments: stats.comments ?? 0,
      shares: stats.shares ?? 0,
      watchTimeMinutes: stats.estimatedMinutesWatched ?? 0,
    }
  })

  return {
    channel: {
      id: account.channelId,
      title: account.channelTitle,
      subscriberCount: Number(channelData.items?.[0]?.statistics?.subscriberCount ?? 0),
    },
    videos,
  }
}
