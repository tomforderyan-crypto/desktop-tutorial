import type { Game, Play } from '../types'

export interface PassingStats {
  completions: number
  attempts: number
  yards: number
  touchdowns: number
  interceptions: number
  sacked: number
  sackYardsLost: number
}

export interface RushingStats {
  carries: number
  yards: number
  touchdowns: number
  fumblesLost: number
}

export interface ReceivingStats {
  targets: number
  receptions: number
  yards: number
  touchdowns: number
}

export interface DefenseStats {
  sacks: number
}

export interface PlayerStatLine {
  playerId: string
  passing: PassingStats
  rushing: RushingStats
  receiving: ReceivingStats
  defense: DefenseStats
}

function emptyLine(playerId: string): PlayerStatLine {
  return {
    playerId,
    passing: { completions: 0, attempts: 0, yards: 0, touchdowns: 0, interceptions: 0, sacked: 0, sackYardsLost: 0 },
    rushing: { carries: 0, yards: 0, touchdowns: 0, fumblesLost: 0 },
    receiving: { targets: 0, receptions: 0, yards: 0, touchdowns: 0 },
    defense: { sacks: 0 },
  }
}

function get(lines: Map<string, PlayerStatLine>, playerId: string): PlayerStatLine {
  let line = lines.get(playerId)
  if (!line) {
    line = emptyLine(playerId)
    lines.set(playerId, line)
  }
  return line
}

/** Derive every player's stat line from the play log — the log is the only
 * source of truth, so this (and only this) is where stats come from. */
export function deriveStats(plays: Play[]): Map<string, PlayerStatLine> {
  const lines = new Map<string, PlayerStatLine>()

  for (const play of plays) {
    switch (play.type) {
      case 'run': {
        const line = get(lines, play.carrierId)
        line.rushing.carries += 1
        line.rushing.yards += play.yards
        if (play.fumbleLost) line.rushing.fumblesLost += 1
        if (play.result === 'touchdown') line.rushing.touchdowns += 1
        break
      }
      case 'pass': {
        const passer = get(lines, play.passerId)
        const target = get(lines, play.targetId)
        passer.passing.attempts += 1
        target.receiving.targets += 1
        if (play.outcome === 'complete') {
          passer.passing.completions += 1
          passer.passing.yards += play.yards
          target.receiving.receptions += 1
          target.receiving.yards += play.yards
          if (play.result === 'touchdown') {
            passer.passing.touchdowns += 1
            target.receiving.touchdowns += 1
          }
        } else if (play.outcome === 'intercepted') {
          passer.passing.interceptions += 1
        }
        break
      }
      case 'sack': {
        const passer = get(lines, play.passerId)
        const defender = get(lines, play.defenderId)
        passer.passing.sacked += 1
        passer.passing.sackYardsLost += play.yards
        defender.defense.sacks += 1
        break
      }
      default:
        break
    }
  }

  return lines
}

export function statLineFor(game: Game, playerId: string): PlayerStatLine {
  return deriveStats(game.plays).get(playerId) ?? emptyLine(playerId)
}

export interface LeaderRow<T> {
  playerId: string
  playerName: string
  playerNumber: string
  teamId: string
  stats: T
}

/** Build sorted leader rows for a category across both rosters, dropping
 * players with zero involvement in that category. */
export function buildLeaders<T>(
  game: Game,
  lines: Map<string, PlayerStatLine>,
  pick: (line: PlayerStatLine) => T,
  hasActivity: (t: T) => boolean,
  sortKey: (t: T) => number,
): LeaderRow<T>[] {
  const rows: LeaderRow<T>[] = []
  for (const team of [game.teamA, game.teamB]) {
    for (const player of team.roster) {
      const line = lines.get(player.id)
      if (!line) continue
      const stats = pick(line)
      if (!hasActivity(stats)) continue
      rows.push({ playerId: player.id, playerName: player.name, playerNumber: player.number, teamId: team.id, stats })
    }
  }
  return rows.sort((a, b) => sortKey(b.stats) - sortKey(a.stats))
}
