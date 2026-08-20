import type { Game, LineupGroup, LineupSlot, Player, RosterPosition, Team, TeamLineup } from '../types'
import { makeId } from '../lib/id'
import { KICKOFF_TOUCHBACK_SPOT } from './downDistanceEngine'

export function createPlayer(input: { number: string; name: string; position: RosterPosition; rawPosition?: string }): Player {
  return { id: makeId('player'), number: input.number, name: input.name, position: input.position, rawPosition: input.rawPosition }
}

export function createTeam(name: string): Team {
  return { id: makeId('team'), name, roster: [] }
}

const DEFAULT_SLOTS: { group: LineupGroup; label: string }[] = [
  { group: 'QB', label: 'QB' },
  { group: 'RB', label: 'RB1' },
  { group: 'RB', label: 'RB2' },
  { group: 'WR', label: 'WR1' },
  { group: 'WR', label: 'WR2' },
  { group: 'WR', label: 'WR3' },
  { group: 'TE', label: 'TE' },
  { group: 'OL', label: 'LT' },
  { group: 'OL', label: 'LG' },
  { group: 'OL', label: 'C' },
  { group: 'OL', label: 'RG' },
  { group: 'OL', label: 'RT' },
]

export function createDefaultLineup(teamId: string): TeamLineup {
  const slots: LineupSlot[] = DEFAULT_SLOTS.map((s) => ({ id: makeId('slot'), group: s.group, label: s.label, playerId: null }))
  return { teamId, slots }
}

export function createGame(teamA: Team, teamB: Team): Game {
  const now = new Date().toISOString()
  return {
    id: makeId('game'),
    createdAt: now,
    updatedAt: now,
    status: 'setup',
    teamA,
    teamB,
    lineups: { [teamA.id]: createDefaultLineup(teamA.id), [teamB.id]: createDefaultLineup(teamB.id) },
    plays: [],
    score: { [teamA.id]: 0, [teamB.id]: 0 },
    possessionTeamId: teamA.id,
    quarter: 1,
    down: 1,
    distance: 10,
    distanceToGoal: KICKOFF_TOUCHBACK_SPOT,
    firstDowns: {
      [teamA.id]: { run: 0, pass: 0, penalty: 0 },
      [teamB.id]: { run: 0, pass: 0, penalty: 0 },
    },
    pendingScoreDecision: null,
    pendingKickoff: null,
    firedMilestones: [],
  }
}
