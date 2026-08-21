import type { StudioState } from '../types'
import { makeDefaultState } from './defaultState'

// Sync mechanism for same-device, no-backend live updates: the control panel
// writes state to localStorage and broadcasts it; every other tab/dock/browser
// source sharing this browser profile picks it up via BroadcastChannel (same
// document session) or the `storage` event (fallback, and what fires when a
// tab was opened before the change). OBS Browser Sources and OBS's own
// Custom Browser Docks share one internal Chromium profile, so a control
// panel opened as a Dock and overlays opened as Browser Sources see the same
// localStorage/BroadcastChannel — see README for the OBS-side setup.
const STORAGE_KEY = 'overlay-studio:state'
const CHANNEL_NAME = 'overlay-studio:sync'

function safeParse(raw: string | null): Partial<StudioState> | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<StudioState>
  } catch {
    return null
  }
}

function mergeWithDefaults(partial: Partial<StudioState> | null): StudioState {
  const defaults = makeDefaultState()
  if (!partial) return defaults
  return {
    scoreboard: { ...defaults.scoreboard, ...partial.scoreboard },
    playClock: { ...defaults.playClock, ...partial.playClock },
    watermark: { ...defaults.watermark, ...partial.watermark },
    ticker: { ...defaults.ticker, ...partial.ticker },
    dataSource: { ...defaults.dataSource, ...partial.dataSource },
    rosterData: partial.rosterData ?? defaults.rosterData,
  }
}

export function loadState(): StudioState {
  if (typeof window === 'undefined') return makeDefaultState()
  return mergeWithDefaults(safeParse(window.localStorage.getItem(STORAGE_KEY)))
}

type Listener = (state: StudioState) => void

export class StudioSyncBus {
  private channel: BroadcastChannel | null = null
  private listeners = new Set<Listener>()
  private onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    this.emit(mergeWithDefaults(safeParse(e.newValue)))
  }

  constructor() {
    if (typeof window === 'undefined') return
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.onmessage = (e: MessageEvent<StudioState>) => this.emit(e.data)
    }
    window.addEventListener('storage', this.onStorage)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(state: StudioState) {
    for (const listener of this.listeners) listener(state)
  }

  publish(state: StudioState) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
    this.channel?.postMessage(state)
  }

  dispose() {
    this.channel?.close()
    if (typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage)
    this.listeners.clear()
  }
}
