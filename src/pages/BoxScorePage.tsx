import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useGame } from '../context/GameContext'
import { deriveStats } from '../lib/stats'
import { Button, Card } from '../components/ui'
import type { Game, Team } from '../types'

function teamTotals(game: Game, teamId: string) {
  const stats = deriveStats(game.plays)
  let rushYards = 0
  let passYards = 0
  let turnovers = 0
  let penalties = 0
  let penaltyYards = 0

  for (const play of game.plays) {
    if (play.possessionTeamId !== teamId) {
      if (play.type === 'penalty' && play.side === 'defense') {
        penalties += 1
        penaltyYards += play.yards
      }
      continue
    }
    if (play.type === 'run') {
      rushYards += play.yards
      if (play.fumbleLost) turnovers += 1
    }
    if (play.type === 'pass') {
      if (play.outcome === 'complete') passYards += play.yards
      if (play.outcome === 'intercepted') turnovers += 1
    }
    if (play.type === 'sack') passYards -= play.yards
    if (play.type === 'penalty' && play.side === 'offense') {
      penalties += 1
      penaltyYards += play.yards
    }
  }

  const fd = game.firstDowns[teamId] ?? { run: 0, pass: 0, penalty: 0 }
  return {
    rushYards, passYards, totalYards: rushYards + passYards, turnovers, penalties, penaltyYards,
    firstDowns: fd.run + fd.pass + fd.penalty, firstDownsBreakdown: fd,
    score: game.score[teamId] ?? 0,
    stats,
  }
}

function TeamBoxScore({ game, team }: { game: Game; team: Team }) {
  const totals = useMemo(() => teamTotals(game, team.id), [game, team.id])

  const rows = team.roster
    .map((p) => ({ player: p, line: totals.stats.get(p.id) }))
    .filter((r) => r.line && (r.line.passing.attempts || r.line.rushing.carries || r.line.receiving.targets || r.line.defense.sacks))

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-3xl tracking-wide">{team.name}</h2>
        <p className="font-mono text-3xl text-[var(--color-amber-soft)]">{totals.score}</p>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Total Yds" value={totals.totalYards} />
        <Stat label="Rush Yds" value={totals.rushYards} />
        <Stat label="Pass Yds" value={totals.passYards} />
        <Stat label="1st Downs" value={totals.firstDowns} />
        <Stat label="Turnovers" value={totals.turnovers} />
        <Stat label="Penalties" value={`${totals.penalties}-${totals.penaltyYards}`} />
        <Stat label="1D Run/Pass/Pen" value={`${totals.firstDownsBreakdown.run}/${totals.firstDownsBreakdown.pass}/${totals.firstDownsBreakdown.penalty}`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <th className="py-1.5 pr-2">Player</th>
              <th className="py-1.5 pr-2">Pass</th>
              <th className="py-1.5 pr-2">Rush</th>
              <th className="py-1.5 pr-2">Rec</th>
              <th className="py-1.5 pr-2">Def</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map(({ player, line }) => (
              <tr key={player.id} className="border-b border-[var(--color-border)]/50">
                <td className="py-1.5 pr-2 font-sans">#{player.number} {player.name}</td>
                <td className="py-1.5 pr-2">
                  {line!.passing.attempts > 0 ? `${line!.passing.completions}/${line!.passing.attempts}, ${line!.passing.yards}y, ${line!.passing.touchdowns}TD, ${line!.passing.interceptions}INT` : '—'}
                </td>
                <td className="py-1.5 pr-2">
                  {line!.rushing.carries > 0 ? `${line!.rushing.carries}c, ${line!.rushing.yards}y, ${line!.rushing.touchdowns}TD` : '—'}
                </td>
                <td className="py-1.5 pr-2">
                  {line!.receiving.targets > 0 ? `${line!.receiving.receptions}/${line!.receiving.targets}, ${line!.receiving.yards}y, ${line!.receiving.touchdowns}TD` : '—'}
                </td>
                <td className="py-1.5 pr-2">{line!.defense.sacks > 0 ? `${line!.defense.sacks} sk` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">{label}</p>
      <p className="font-mono text-base text-[var(--color-text)]">{value}</p>
    </div>
  )
}

export default function BoxScorePage() {
  const { game } = useGame()
  const navigate = useNavigate()
  const { gameId } = useParams()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wide">Box Score</h1>
        <div className="flex gap-2">
          {game.status !== 'final' && (
            <Button variant="secondary" onClick={() => navigate(`/game/${gameId}/live`)}>← Back to Live</Button>
          )}
          <Button variant="primary" onClick={() => window.print()}>Export PDF</Button>
        </div>
      </div>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        {game.teamA.name} vs {game.teamB.name} · {format(new Date(game.createdAt), 'MMMM d, yyyy')}
        {game.status !== 'final' && ' · In progress'}
      </p>

      <div className="flex flex-col gap-4">
        <TeamBoxScore game={game} team={game.teamA} />
        <TeamBoxScore game={game} team={game.teamB} />
      </div>
    </div>
  )
}
