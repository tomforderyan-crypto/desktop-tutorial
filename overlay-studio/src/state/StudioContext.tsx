import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { StudioState } from '../types'
import { loadState, StudioSyncBus } from '../lib/sync'

interface StudioContextValue {
  state: StudioState
  /** Shallow-patches one top-level slice of state (e.g. patch('scoreboard', { period: 'Q2' })) and syncs it everywhere. */
  patch: <K extends keyof StudioState>(key: K, value: Partial<StudioState[K]> | StudioState[K]) => void
  /** Replaces a whole top-level slice (e.g. rosterData) and syncs it everywhere. */
  set: <K extends keyof StudioState>(key: K, value: StudioState[K]) => void
}

const StudioCtx = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(() => loadState())
  const busRef = useRef<StudioSyncBus | null>(null)
  // Set right before applying a bus-received update, so the publish effect
  // below doesn't immediately echo it back out — otherwise two tabs would
  // ping-pong the same state forever.
  const suppressPublishRef = useRef(false)
  // The very first effect run is just the snapshot this page loaded from
  // localStorage on mount, not a real edit — publishing it would let a
  // late-opening, still-stale overlay page clobber a more recent change
  // another page already made (e.g. control panel loads data, then an
  // overlay opens and re-broadcasts the pre-load snapshot it read).
  const mountedRef = useRef(false)

  useEffect(() => {
    const bus = new StudioSyncBus()
    busRef.current = bus
    const unsubscribe = bus.subscribe((next) => {
      suppressPublishRef.current = true
      setState(next)
    })
    return () => {
      unsubscribe()
      bus.dispose()
    }
  }, [])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (suppressPublishRef.current) {
      suppressPublishRef.current = false
      return
    }
    busRef.current?.publish(state)
  }, [state])

  const patch = useCallback(
    <K extends keyof StudioState>(key: K, value: Partial<StudioState[K]> | StudioState[K]) => {
      setState((prev) => {
        const merged = typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...prev[key], ...value } : value
        return { ...prev, [key]: merged }
      })
    },
    [],
  )

  const set = useCallback(<K extends keyof StudioState>(key: K, value: StudioState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  return <StudioCtx.Provider value={{ state, patch, set }}>{children}</StudioCtx.Provider>
}

export function useStudio() {
  const ctx = useContext(StudioCtx)
  if (!ctx) throw new Error('useStudio must be used within StudioProvider')
  return ctx
}
