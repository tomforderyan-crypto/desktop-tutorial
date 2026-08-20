import type { Game } from '../types'
import { ballSpot, downAndDistance } from '../lib/format'

export function Scoreboard({ game }: { game: Game }) {
  const teams = [game.teamA, game.teamB]
  const decisionPending = Boolean(game.pendingScoreDecision || game.pendingKickoff)

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-ink)]">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-b-lg bg-[var(--color-border)]">
        {teams.map((team) => {
          const hasBall = game.possessionTeamId === team.id && !decisionPending
          return (
            <div key={team.id} className="bg-[var(--color-field)] px-4 py-3">
              <div className="flex items-center gap-1.5">
                {hasBall && <span className="text-[var(--color-amber)]" aria-label="Possession">●</span>}
                <span className="truncate text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {team.name}
                </span>
              </div>
              <div className="font-display text-5xl leading-none text-[var(--color-text)]">
                {game.score[team.id] ?? 0}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 px-4 py-2 text-sm">
        <span className="font-mono text-[var(--color-amber-soft)]">Q{game.quarter}</span>
        {decisionPending ? (
          <span className="font-mono font-semibold text-[var(--color-flag)]">
            {game.pendingScoreDecision ? 'PAT / 2-PT PENDING' : 'KICKOFF PENDING'}
          </span>
        ) : (
          <>
            <span className="font-mono font-semibold text-[var(--color-text)]">
              {downAndDistance(game.down, game.distance, game.distanceToGoal)}
            </span>
            <span className="font-mono text-[var(--color-text-muted)]">{ballSpot(game.distanceToGoal)}</span>
          </>
        )}
      </div>
    </div>
  )
}
