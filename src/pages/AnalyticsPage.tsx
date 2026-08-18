import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db/db'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { PLATFORMS, PLATFORM_LABELS, type Platform } from '../types'
import { getBestWindows } from '../lib/bestTime'
import { Card, EmptyState, SectionTitle } from '../components/ui'
import { ChartIcon, ClockIcon, PlugIcon, TrendUpIcon } from '../components/icons'
import YoutubeConnectCard from '../components/YoutubeConnectCard'

const MOCK_PLATFORMS = PLATFORMS.filter((p) => p !== 'youtube' && p !== 'youtube_shorts')

const CHART_COLORS = ['#e10600', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7']

export default function AnalyticsPage() {
  const settings = useSettings()
  const snapshots = useLiveQuery(() => db.analyticsSnapshots.toArray(), []) ?? []

  const connected = new Set(settings.connectedPlatforms)
  const connectedSnapshots = snapshots.filter((s) => connected.has(s.platform))

  const viewsByPlatform = useMemo(() => {
    const map = new Map<Platform, number>()
    for (const s of connectedSnapshots) map.set(s.platform, (map.get(s.platform) ?? 0) + s.views)
    return Array.from(map.entries()).map(([platform, views]) => ({ platform: PLATFORM_LABELS[platform], views }))
  }, [connectedSnapshots])

  const engagementByTopic = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of connectedSnapshots) {
      const engagement = s.likes + s.comments * 2 + s.shares * 1.5
      map.set(s.topic, (map.get(s.topic) ?? 0) + engagement)
    }
    return Array.from(map.entries())
      .map(([topic, engagement]) => ({ topic, engagement: Math.round(engagement) }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 6)
  }, [connectedSnapshots])

  async function toggleConnect(platform: Platform) {
    const next = connected.has(platform)
      ? settings.connectedPlatforms.filter((p) => p !== platform)
      : [...settings.connectedPlatforms, platform]
    await updateSettings({ connectedPlatforms: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title="Analytics" />

      <YoutubeConnectCard serverUrl={settings.pushServerUrl} connectedPlatforms={settings.connectedPlatforms} />

      <Card>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <PlugIcon className="h-4 w-4" /> Other platforms
        </p>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          Mock connections for now — wire these to real OAuth + API calls once your accounts are live.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOCK_PLATFORMS.map((platform) => {
            const isConnected = connected.has(platform)
            return (
              <button
                key={platform}
                onClick={() => toggleConnect(platform)}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                  isConnected
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                }`}
              >
                <div className="font-semibold text-[var(--color-text)]">{PLATFORM_LABELS[platform]}</div>
                {isConnected ? 'Connected' : 'Tap to connect'}
              </button>
            )
          })}
        </div>
      </Card>

      {connectedSnapshots.length === 0 ? (
        <EmptyState
          title="No analytics yet"
          body="Connect a platform above (or load demo data in Settings) to see views, engagement, and best posting times."
        />
      ) : (
        <>
          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <ChartIcon className="h-4 w-4" /> Views by platform
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={viewsByPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262b33" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fill: '#9aa1ac', fontSize: 11 }} axisLine={{ stroke: '#262b33' }} tickLine={false} />
                  <YAxis tick={{ fill: '#9aa1ac', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c2027', border: '1px solid #262b33', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                    {viewsByPlatform.map((entry, i) => (
                      <Cell key={entry.platform} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <TrendUpIcon className="h-4 w-4" /> Top topics by engagement
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementByTopic} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262b33" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9aa1ac', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="topic" type="category" width={100} tick={{ fill: '#9aa1ac', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c2027', border: '1px solid #262b33', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="engagement" fill="#e10600" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
              This ranking is what the Idea Generator uses to weight future suggestions.
            </p>
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
              <ClockIcon className="h-4 w-4" /> Best time to post
            </p>
            <div className="flex flex-col gap-3">
              {Array.from(connected).map((platform) => {
                const { windows, source } = getBestWindows(snapshots, platform, 3)
                return (
                  <div key={platform} className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{PLATFORM_LABELS[platform]}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {source === 'live-analytics' ? 'Based on your post history' : 'Baseline estimate'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {windows.map((w) => (
                        <span key={w.hour} className="rounded-full bg-[var(--color-surface-alt)] px-2 py-1 text-[11px] font-semibold text-[var(--color-accent-soft)]">
                          {w.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
