import type { Game, Play } from '../types'

export interface Milestone {
  key: string
  label: string
  playerId: string
  playId: string
}

function findPlayer(game: Game, playerId: string): { name: string; number: string } | null {
  const player = [...game.teamA.roster, ...game.teamB.roster].find((p) => p.id === playerId)
  return player ? { name: player.name, number: player.number } : null
}

/** Scan the play log in order and surface in-game "firsts" not already in
 * `alreadyFired`. Purely derived from the log — nothing is stored beyond the
 * fired-keys list on the game, so this stays single-game-scoped by design. */
export function detectNewMilestones(game: Game, alreadyFired: Set<string>): Milestone[] {
  const found: Milestone[] = []
  const seenCarry = new Set<string>()
  const seenReception = new Set<string>()
  const seenPass = new Set<string>()
  const seenSack = new Set<string>()
  const seenBigPlay = new Set<string>() // team-level: first play over 10 yards
  const seenTouchdown = new Set<string>() // team-level: first TD

  const emit = (key: string, label: string, playerId: string, play: Play) => {
    if (alreadyFired.has(key)) return
    found.push({ key, label, playerId, playId: play.id })
  }

  for (const play of game.plays) {
    const teamId = play.possessionTeamId

    if (play.type === 'run') {
      if (!seenCarry.has(play.carrierId)) {
        seenCarry.add(play.carrierId)
        const p = findPlayer(game, play.carrierId)
        if (p) emit(`first-carry:${play.carrierId}`, `First carry for #${p.number} ${p.name}`, play.carrierId, play)
      }
      if (Math.abs(play.yards) > 10 && !seenBigPlay.has(teamId)) {
        seenBigPlay.add(teamId)
        const p = findPlayer(game, play.carrierId)
        if (p) emit(`first-big-play:${teamId}`, `First play over 10 yards — #${p.number} ${p.name} for ${play.yards}`, play.carrierId, play)
      }
      if (play.result === 'touchdown') {
        const p = findPlayer(game, play.carrierId)
        if (p) emit(`first-td:${play.carrierId}`, `First touchdown for #${p.number} ${p.name}`, play.carrierId, play)
        if (!seenTouchdown.has(teamId)) {
          seenTouchdown.add(teamId)
          emit(`first-team-td:${teamId}`, `First touchdown of the game`, play.carrierId, play)
        }
      }
    }

    if (play.type === 'pass') {
      if (!seenPass.has(play.passerId)) {
        seenPass.add(play.passerId)
        const p = findPlayer(game, play.passerId)
        if (p) emit(`first-pass-attempt:${play.passerId}`, `First pass attempt for #${p.number} ${p.name}`, play.passerId, play)
      }
      if (play.outcome === 'complete') {
        if (!seenReception.has(play.targetId)) {
          seenReception.add(play.targetId)
          const p = findPlayer(game, play.targetId)
          if (p) emit(`first-reception:${play.targetId}`, `First reception for #${p.number} ${p.name}`, play.targetId, play)
        }
        if (play.yards > 10 && !seenBigPlay.has(teamId)) {
          seenBigPlay.add(teamId)
          const p = findPlayer(game, play.targetId)
          if (p) emit(`first-big-play:${teamId}`, `First play over 10 yards — #${p.number} ${p.name} for ${play.yards}`, play.targetId, play)
        }
        if (play.result === 'touchdown') {
          const passer = findPlayer(game, play.passerId)
          const target = findPlayer(game, play.targetId)
          if (target) emit(`first-td:${play.targetId}`, `First touchdown for #${target.number} ${target.name}`, play.targetId, play)
          if (passer) emit(`first-passing-td:${play.passerId}`, `First passing touchdown for #${passer.number} ${passer.name}`, play.passerId, play)
          if (!seenTouchdown.has(teamId)) {
            seenTouchdown.add(teamId)
            emit(`first-team-td:${teamId}`, `First touchdown of the game`, play.targetId, play)
          }
        }
      }
      if (play.outcome === 'intercepted') {
        const p = findPlayer(game, play.passerId)
        if (p) emit(`first-int:${play.passerId}`, `First interception thrown by #${p.number} ${p.name}`, play.passerId, play)
      }
    }

    if (play.type === 'sack' && !seenSack.has(play.defenderId)) {
      seenSack.add(play.defenderId)
      const p = findPlayer(game, play.defenderId)
      if (p) emit(`first-sack:${play.defenderId}`, `First sack for #${p.number} ${p.name}`, play.defenderId, play)
    }

    if (play.type === 'fieldGoal' && play.made) {
      const p = play.kickerId ? findPlayer(game, play.kickerId) : null
      emit(`first-fg:${teamId}`, p ? `First field goal made — #${p.number} ${p.name}` : 'First field goal made', play.kickerId ?? '', play)
    }
  }

  return found
}
