import type { PlayClockState } from '../types'

/** Derives the currently-displayed seconds from a snapshot + elapsed wall time, so every viewer counts down in sync without repeated sync messages. */
export function computeRemaining(state: PlayClockState, now = Date.now()): number {
  if (!state.running) return Math.max(0, state.secondsRemaining)
  const elapsed = (now - state.updatedAt) / 1000
  return Math.max(0, state.secondsRemaining - elapsed)
}
