import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { seedDemoData, clearAllData } from '../lib/demoData'
import {
  isPushSupported,
  requestNotificationPermission,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push'
import { PLATFORMS, PLATFORM_LABELS, type Platform } from '../types'
import { Button, Card, Input, SectionTitle } from '../components/ui'
import { BellIcon, CheckIcon, PlugIcon, RefreshIcon, SparklesIcon } from '../components/icons'

export default function SettingsPage() {
  const settings = useSettings()
  const ideaCount = useLiveQuery(() => db.ideas.count(), []) ?? 0
  const [name, setName] = useState(settings.creatorName)
  const [serverUrl, setServerUrl] = useState(settings.pushServerUrl)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)

  useEffect(() => setName(settings.creatorName), [settings.creatorName])
  useEffect(() => setServerUrl(settings.pushServerUrl), [settings.pushServerUrl])

  async function saveName() {
    await updateSettings({ creatorName: name || 'Creator' })
  }

  async function saveServerUrl() {
    await updateSettings({ pushServerUrl: serverUrl })
  }

  async function togglePlatform(platform: Platform) {
    const next = settings.enabledPlatforms.includes(platform)
      ? settings.enabledPlatforms.filter((p) => p !== platform)
      : [...settings.enabledPlatforms, platform]
    await updateSettings({ enabledPlatforms: next })
  }

  async function enablePush() {
    setPushError(null)
    setPushBusy(true)
    try {
      if (!isPushSupported()) {
        throw new Error('Push notifications are not supported in this browser. Install the app to your home screen first.')
      }
      const permission = await requestNotificationPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.')
      }
      await subscribeToPush(serverUrl)
      await updateSettings({ pushEnabled: true, pushServerUrl: serverUrl })
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Could not enable push notifications.')
    } finally {
      setPushBusy(false)
    }
  }

  async function disablePush() {
    setPushBusy(true)
    try {
      await unsubscribeFromPush(serverUrl)
      await updateSettings({ pushEnabled: false })
    } finally {
      setPushBusy(false)
    }
  }

  async function testPush() {
    setPushError(null)
    try {
      await sendTestPush(serverUrl)
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Could not send test notification.')
    }
  }

  async function loadDemoData() {
    setDemoBusy(true)
    setDemoMessage(null)
    try {
      const result = await seedDemoData(db)
      setDemoMessage(`Added ${result.calendarEntries} calendar posts, ${result.analyticsSnapshots} analytics snapshots, ${result.revenueEntries} revenue entries.`)
    } finally {
      setDemoBusy(false)
    }
  }

  async function resetData() {
    if (!confirm('This clears all ideas, calendar posts, analytics, and revenue. Continue?')) return
    setDemoBusy(true)
    try {
      await clearAllData(db)
      setDemoMessage('All data cleared.')
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title="Settings" />

      <Card>
        <p className="mb-3 text-sm font-semibold">Profile</p>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Creator name</label>
        <div className="mt-1 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="secondary" onClick={saveName}>
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <PlugIcon className="h-4 w-4" /> Platforms you post on
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const on = settings.enabledPlatforms.includes(platform)
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${
                  on
                    ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-text)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                }`}
              >
                {PLATFORM_LABELS[platform]}
                {on && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <BellIcon className="h-4 w-4" /> Push notifications
        </p>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          Powers streak nudges and posting-time reminders. Requires the Pit Lane push server to be running (see README) and the
          app installed to your home screen on iOS.
        </p>
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Push server URL</label>
        <div className="mt-1 flex gap-2">
          <Input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="http://localhost:8787" />
          <Button variant="secondary" onClick={saveServerUrl}>
            Save
          </Button>
        </div>

        {pushError && <p className="mt-2 text-xs text-red-400">{pushError}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {settings.pushEnabled ? (
            <>
              <Button variant="secondary" onClick={disablePush} disabled={pushBusy}>
                Disable
              </Button>
              <Button variant="secondary" onClick={testPush} disabled={pushBusy}>
                Send test notification
              </Button>
            </>
          ) : (
            <Button onClick={enablePush} disabled={pushBusy}>
              {pushBusy ? 'Enabling…' : 'Enable notifications'}
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <SparklesIcon className="h-4 w-4" /> Demo data
        </p>
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          Seed ~45 days of realistic mock posts, analytics, and revenue so you can explore every feature before you're live.
          {ideaCount > 0 && ` You currently have ${ideaCount} unliked idea(s) saved.`}
        </p>
        {demoMessage && <p className="mb-2 text-xs text-emerald-400">{demoMessage}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadDemoData} disabled={demoBusy} className="flex items-center gap-1.5">
            <RefreshIcon className={`h-3.5 w-3.5 ${demoBusy ? 'animate-spin' : ''}`} />
            Load demo data
          </Button>
          <Button variant="danger" onClick={resetData} disabled={demoBusy}>
            Clear all data
          </Button>
        </div>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold">Install Pit Lane</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          iOS: open this page in Safari, tap Share, then "Add to Home Screen".
          <br />
          Android: open in Chrome, tap the menu, then "Install app" (or "Add to Home screen").
        </p>
      </Card>
    </div>
  )
}
