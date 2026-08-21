import type { Game } from '../types'

// A distilled, broadcast-facing snapshot of a Game — just what the overlay
// graphic renders. Kept separate from Game so the overlay never sees roster
// photos, the play log, etc., and so its shape can stay stable even as the
// tracker's internal Game model evolves.
export interface OverlayState {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  quarter: number
  possession: 'A' | 'B'
  down: number
  distance: number
  distanceToGoal: number
  decision: 'patTwoPoint' | 'kickoff' | null
  final: boolean
  updatedAt: string
}

export function toOverlayState(game: Game): OverlayState {
  return {
    teamAName: game.teamA.name,
    teamBName: game.teamB.name,
    scoreA: game.score[game.teamA.id] ?? 0,
    scoreB: game.score[game.teamB.id] ?? 0,
    quarter: game.quarter,
    possession: game.possessionTeamId === game.teamA.id ? 'A' : 'B',
    down: game.down,
    distance: game.distance,
    distanceToGoal: game.distanceToGoal,
    decision: game.pendingScoreDecision ? 'patTwoPoint' : game.pendingKickoff ? 'kickoff' : null,
    final: game.status === 'final',
    updatedAt: new Date().toISOString(),
  }
}
