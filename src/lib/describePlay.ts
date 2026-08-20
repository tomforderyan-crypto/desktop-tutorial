import type { Game, Play } from '../types'
import { signedYards } from './format'

function playerLabel(game: Game, playerId: string): string {
  const player = [...game.teamA.roster, ...game.teamB.roster].find((p) => p.id === playerId)
  return player ? `#${player.number} ${player.name}` : 'Unknown'
}

export function describePlay(game: Game, play: Play): string {
  switch (play.type) {
    case 'run': {
      const base = `${playerLabel(game, play.carrierId)} run for ${signedYards(play.yards)}`
      if (play.fumbleLost) return `${base} — FUMBLE, lost`
      if (play.result === 'touchdown') return `${base} — TOUCHDOWN`
      return base
    }
    case 'pass': {
      if (play.outcome === 'incomplete') return `Incomplete, ${playerLabel(game, play.passerId)} to ${playerLabel(game, play.targetId)}`
      if (play.outcome === 'intercepted') return `INTERCEPTED — ${playerLabel(game, play.passerId)} pass picked off`
      const base = `${playerLabel(game, play.passerId)} to ${playerLabel(game, play.targetId)} for ${play.yards}`
      return play.result === 'touchdown' ? `${base} — TOUCHDOWN` : base
    }
    case 'sack':
      return `Sack — ${playerLabel(game, play.defenderId)} for -${play.yards}`
    case 'penalty':
      return `Penalty: ${play.penaltyName} (${play.side}), ${play.yards} yds`
    case 'fieldGoal':
      return play.made
        ? `Field goal GOOD${play.distance ? ` (${play.distance} yds)` : ''}`
        : `Field goal NO GOOD${play.distance ? ` (${play.distance} yds)` : ''}`
    case 'safety':
      return 'SAFETY'
    case 'extraPoint':
      return play.kind === 'kick'
        ? `Extra point ${play.good ? 'GOOD' : 'NO GOOD'}`
        : `2-point conversion ${play.good ? 'GOOD' : 'FAILED'}`
    case 'kickoff':
      return play.afterSafety ? 'Free kick' : 'Kickoff'
    case 'punt':
      return 'Punt'
    default:
      return 'Play'
  }
}
