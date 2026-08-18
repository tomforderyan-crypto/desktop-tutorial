import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../db/db'
import { updateSettings } from '../hooks/useSettings'
import {
  disconnectYoutube,
  getYoutubeStatus,
  syncYoutube,
  videosToSnapshots,
  youtubeConnectUrl,
  type YoutubeStatus,
} from '../lib/youtubeAnalytics'
import { Button, Card } from './ui'
import { CheckIcon, PlugIcon, RefreshIcon } from './icons'
import type { Platform } from '../types'

export default function YoutubeConnectCard({
  serverUrl,
  connectedPlatforms,
}: {
  serverUrl: string
  connectedPlatforms: Platform[]
}) {
  const [status, setStatus] = useState<YoutubeStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  async function refreshStatus() {
    try {
      const s = await getYoutubeStatus(serverUrl)
      setStatus(s)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the push server')
      setStatus(null)
    }
  }

  useEffect(() => {
    refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl])

  useEffect(() => {
    const flag = searchParams.get('youtube')
    if (!flag) return
    if (flag === 'connected') {
      refreshStatus().then(() => handleSync())
    } else {
      setError('YouTube connection failed — check the server logs and try again.')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('youtube')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSync() {
    setSyncing(true)
    setSyncMessage(null)
    setError(null)
    try {
      const { videos, channel } = await syncYoutube(serverUrl)
      const snapshots = videosToSnapshots(videos)
      await db.analyticsSnapshots.bulkPut(snapshots)
      const next = new Set<Platform>(connectedPlatforms)
      next.add('youtube')
      next.add('youtube_shorts')
      await updateSettings({ connectedPlatforms: Array.from(next) })
      setSyncMessage(`Synced ${videos.length} video${videos.length === 1 ? '' : 's'} from ${channel.title}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    await disconnectYoutube(serverUrl)
    await refreshStatus()
  }

  return (
    <Card>
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <PlugIcon className="h-4 w-4" /> YouTube
      </p>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {syncMessage && <p className="mb-2 text-xs text-emerald-400">{syncMessage}</p>}

      {!status ? (
        <p className="text-xs text-[var(--color-text-muted)]">Checking connection…</p>
      ) : !status.configured ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          The push server isn't set up for YouTube yet — add <code>GOOGLE_CLIENT_ID</code> /{' '}
          <code>GOOGLE_CLIENT_SECRET</code> to its environment.
        </p>
      ) : status.connected ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckIcon className="h-4 w-4 text-emerald-400" />
            Connected as <span className="font-medium">{status.channelTitle}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5">
              <RefreshIcon className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button variant="ghost" onClick={handleDisconnect} className="text-red-400">
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <a href={youtubeConnectUrl(serverUrl)}>
          <Button>Connect with Google</Button>
        </a>
      )}
    </Card>
  )
}
