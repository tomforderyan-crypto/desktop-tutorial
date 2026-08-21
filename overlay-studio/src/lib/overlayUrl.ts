import type { OverlayKind } from '../types'

/** Absolute, paste-into-OBS URL for one overlay route (works with the app's HashRouter on any static host). */
export function buildOverlayUrl(kind: OverlayKind): string {
  if (typeof window === 'undefined') return ''
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/overlay/${kind}`
}
