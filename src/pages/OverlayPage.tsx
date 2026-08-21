import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { OverlayState } from '../lib/overlay'
import { subscribeOverlayState } from '../lib/overlaySync'
import { ballSpot, downAndDistance } from '../lib/format'

// Meant to be loaded as an OBS Browser Source (or any capture that supports
// page transparency) — not part of the normal app chrome. Renders nothing
// but the scorebug itself against a transparent page so it composites
// straight over game footage.
export default function OverlayPage() {
  const { gameId } = useParams()
  if (!gameId) return null
  // Keying on gameId gives each game a fresh mount instead of carrying the
  // previous game's state across an (in-practice rare) param change.
  return <OverlayView key={gameId} gameId={gameId} />
}

function OverlayView({ gameId }: { gameId: string }) {
  const [state, setState] = useState<OverlayState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('overlay-transparent')
    document.body.classList.add('overlay-transparent')
    return () => {
      document.documentElement.classList.remove('overlay-transparent')
      document.body.classList.remove('overlay-transparent')
    }
  }, [])

  useEffect(() => subscribeOverlayState(gameId, setState, setError), [gameId])

  const decisionLabel = state?.decision === 'patTwoPoint' ? 'PAT / 2-PT' : state?.decision === 'kickoff' ? 'KICKOFF' : null
  const teams = state ? [
    { key: 'A', name: state.teamAName, score: state.scoreA, hasBall: state.possession === 'A' },
    { key: 'B', name: state.teamBName, score: state.scoreB, hasBall: state.possession === 'B' },
  ] : []

  return (
    <div className="fixed inset-0 flex items-end justify-start p-6">
      {state ? (
        <div className="flex items-stretch overflow-hidden rounded-lg border border-[var(--color-border-bright)]/80 bg-[var(--color-ink)]/85 shadow-2xl [text-shadow:0_1px_3px_rgb(0_0_0_/_60%)]">
          {teams.map((t) => (
            <div key={t.key} className="flex items-center gap-3 border-r border-[var(--color-border)] px-4 py-2.5 last:border-r-0">
              {!state.final && !decisionLabel && t.hasBall && (
                <span className="text-[var(--color-amber)]" aria-label="Possession">●</span>
              )}
              <span className="max-w-[10rem] truncate text-sm font-semibold uppercase tracking-wide text-[var(--color-text)]">
                {t.name}
              </span>
              <span className="font-display text-4xl leading-none text-[var(--color-amber-soft)]">{t.score}</span>
            </div>
          ))}
          <div className="flex flex-col items-center justify-center gap-0.5 bg-[var(--color-surface)]/90 px-4 py-2.5 text-center">
            <span className="font-mono text-xs font-semibold text-[var(--color-amber-soft)]">Q{state.quarter}</span>
            {state.final ? (
              <span className="font-mono text-xs font-bold text-[var(--color-text)]">FINAL</span>
            ) : decisionLabel ? (
              <span className="font-mono text-xs font-bold text-[var(--color-flag)]">{decisionLabel}</span>
            ) : (
              <>
                <span className="font-mono text-xs font-bold text-[var(--color-text)]">
                  {downAndDistance(state.down, state.distance, state.distanceToGoal)}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{ballSpot(state.distanceToGoal)}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[var(--color-border-bright)]/60 bg-black/40 px-4 py-2 font-mono text-xs text-[var(--color-text-dim)]">
          {error ?? 'Fieldside overlay — waiting for game data…'}
        </div>
      )}
    </div>
  )
}
