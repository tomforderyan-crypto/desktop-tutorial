import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { AppSettings } from '../types'
import { PLATFORMS } from '../types'

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  creatorName: 'Creator',
  monthlyIncomeGoal: 1000,
  enabledPlatforms: PLATFORMS,
  connectedPlatforms: [],
  pushEnabled: false,
  pushServerUrl: 'http://localhost:8787',
  onboardingComplete: false,
}

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('settings')
  if (existing) return existing
  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export function useSettings(): AppSettings {
  const settings = useLiveQuery(() => db.settings.get('settings'), [])
  return settings ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await ensureSettings()
  await db.settings.put({ ...current, ...patch })
}
