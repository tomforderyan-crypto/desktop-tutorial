import { useEffect, useRef, useState } from 'react'
import type { BroadcastState } from './broadcast'
import { BROADCAST_HTTP_BASE, BROADCAST_WS_BASE } from './broadcast'

export interface OverlaySelection {
  playerId: string | null
}

type ServerMessage = { type: 'state'; payload: BroadcastState } | { type: 'overlay'; payload: OverlaySelection }

const RECONNECT_DELAY_MS = 2000

/** Live view of the broadcast bridge server: the current stats.json state
 * and which player (if any) the Control Panel has selected for the overlay.
 * Used by both the Overlay page and the Control Panel so a click in one
 * shows up in the other with no polling delay. */
export function useBroadcastConnection() {
  const [state, setState] = useState<BroadcastState | null>(null)
  const [overlay, setOverlay] = useState<OverlaySelection>({ playerId: null })
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    fetch(`${BROADCAST_HTTP_BASE}/api/state`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setState(data)
      })
      .catch(() => {})

    fetch(`${BROADCAST_HTTP_BASE}/api/overlay`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setOverlay(data)
      })
      .catch(() => {})

    function connect() {
      if (cancelled) return
      const ws = new WebSocket(`${BROADCAST_WS_BASE}/ws`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) retryTimer = setTimeout(connect, RECONNECT_DELAY_MS)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as ServerMessage
          if (msg.type === 'state') setState(msg.payload)
          else if (msg.type === 'overlay') setOverlay(msg.payload)
        } catch {
          // ignore malformed frame
        }
      }
    }
    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [])

  return { state, overlay, connected }
}

/** Tell the overlay which player to show (or null to hide it). Called from
 * the Control Panel — fire-and-forget, the WS broadcast is what actually
 * updates the overlay in real time. */
export async function setOverlaySelection(playerId: string | null): Promise<void> {
  try {
    await fetch(`${BROADCAST_HTTP_BASE}/api/overlay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
  } catch {
    // Overlay bridge server isn't running — nothing to do.
  }
}
