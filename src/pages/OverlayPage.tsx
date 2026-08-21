import { useEffect, useMemo, useState } from 'react'
import { StatCard, type CardPhase } from '../components/StatCard'
import { useBroadcastConnection } from '../lib/broadcastClient'

const EXIT_ANIMATION_MS = 240

// The single stable URL pasted into OBS/vMix as a Browser Source
// (…/#/overlay). Nothing renders here but the card itself — no chrome, no
// background — so this must stay a plain Route with no <Layout>.
export default function OverlayPage() {
  useEffect(() => {
    document.documentElement.classList.add('overlay-transparent')
    document.body.classList.add('overlay-transparent')
    return () => {
      document.documentElement.classList.remove('overlay-transparent')
      document.body.classList.remove('overlay-transparent')
    }
  }, [])

  const { state, overlay } = useBroadcastConnection()
  const [phase, setPhase] = useState<CardPhase>('exiting')
  const [shownPlayerId, setShownPlayerId] = useState<string | null>(null)

  const targetPlayerId = overlay.playerId
  const player = useMemo(() => state?.players.find((p) => p.id === shownPlayerId) ?? null, [state, shownPlayerId])
  const team = useMemo(() => state?.teams.find((t) => t.id === player?.teamId) ?? null, [state, player])

  useEffect(() => {
    if (targetPlayerId) {
      setShownPlayerId(targetPlayerId)
      // Two ticks so the browser commits the "entering" transform before
      // flipping to "visible" — otherwise the transition never runs.
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('visible')))
      return () => cancelAnimationFrame(raf)
    }
    setPhase('exiting')
    const timer = setTimeout(() => setShownPlayerId(null), EXIT_ANIMATION_MS)
    return () => clearTimeout(timer)
  }, [targetPlayerId])

  if (!shownPlayerId || !player || !team) return null

  return <StatCard player={player} team={team} phase={targetPlayerId === shownPlayerId ? phase : 'exiting'} />
}
