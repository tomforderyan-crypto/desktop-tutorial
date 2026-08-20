import { useMemo } from 'react'
import type { Game } from '../types'
import { buildLeaders, deriveStats } from '../lib/stats'
import { Card } from './ui'

function TeamTag({ game, teamId }: { game: Game; teamId: string }) {
  const name = teamId === game.teamA.id ? game.teamA.name : game.teamB.name
  return <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">{name}</span>
}

export function LeadersPanel({ game }: { game: Game }) {
  const lines = useMemo(() => deriveStats(game.plays), [game.plays])

  const passers = buildLeaders(
    game, lines,
    (l) => l.passing,
    (s) => s.attempts > 0,
    (s) => s.yards,
  )
  const rushers = buildLeaders(
    game, lines,
    (l) => l.rushing,
    (s) => s.carries > 0,
    (s) => s.yards,
  )
  const receivers = buildLeaders(
    game, lines,
    (l) => l.receiving,
    (s) => s.targets > 0,
    (s) => s.yards,
  )

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Card className="p-3">
        <h3 className="mb-2 font-display text-xl tracking-wide text-[var(--color-amber-soft)]">Passing</h3>
        {passers.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">No attempts yet.</p>}
        <ul className="flex flex-col gap-2">
          {passers.map((r) => (
            <li key={r.playerId} className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  #{r.playerNumber} {r.playerName}
                </p>
                <TeamTag game={game} teamId={r.teamId} />
              </div>
              <p className="font-mono text-sm text-[var(--color-text)]">
                {r.stats.completions}/{r.stats.attempts}, {r.stats.yards} yds, {r.stats.touchdowns} TD
                {r.stats.interceptions > 0 && `, ${r.stats.interceptions} INT`}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-3">
        <h3 className="mb-2 font-display text-xl tracking-wide text-[var(--color-amber-soft)]">Rushing</h3>
        {rushers.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">No carries yet.</p>}
        <ul className="flex flex-col gap-2">
          {rushers.map((r) => (
            <li key={r.playerId} className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  #{r.playerNumber} {r.playerName}
                </p>
                <TeamTag game={game} teamId={r.teamId} />
              </div>
              <p className="font-mono text-sm text-[var(--color-text)]">
                {r.stats.carries} car, {r.stats.yards} yds, {r.stats.touchdowns} TD
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-3">
        <h3 className="mb-2 font-display text-xl tracking-wide text-[var(--color-amber-soft)]">Receiving</h3>
        {receivers.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">No targets yet.</p>}
        <ul className="flex flex-col gap-2">
          {receivers.map((r) => (
            <li key={r.playerId} className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  #{r.playerNumber} {r.playerName}
                </p>
                <TeamTag game={game} teamId={r.teamId} />
              </div>
              <p className="font-mono text-sm text-[var(--color-text)]">
                {r.stats.receptions}/{r.stats.targets}, {r.stats.yards} yds, {r.stats.touchdowns} TD
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
