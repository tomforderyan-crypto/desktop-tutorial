import type {
  BaseSituation,
  ExtraPointPlay,
  FieldGoalPlay,
  FirstDownTally,
  Game,
  KickoffPlay,
  PenaltyPlay,
  Play,
  PlayResult,
  PuntPlay,
  RunPlay,
  PassPlay,
  SackPlay,
  SafetyPlay,
  PenaltySide,
} from '../types'
import { makeId } from '../lib/id'
import { applyGain, applyPenalty, applyTurnover, flipPossession, KICKOFF_TOUCHBACK_SPOT } from './downDistanceEngine'
import { getPenaltyType, resolvePenaltyEffect } from './penalties'

export function otherTeamId(game: Game, teamId: string): string {
  return teamId === game.teamA.id ? game.teamB.id : game.teamA.id
}

function currentSituation(game: Game): BaseSituation {
  return {
    quarter: game.quarter,
    possessionTeamId: game.possessionTeamId,
    down: game.down,
    distance: game.distance,
    distanceToGoal: game.distanceToGoal,
  }
}

function withSituation(game: Game, situation: BaseSituation): Game {
  return {
    ...game,
    possessionTeamId: situation.possessionTeamId,
    down: situation.down,
    distance: situation.distance,
    distanceToGoal: situation.distanceToGoal,
    quarter: situation.quarter,
  }
}

function bumpFirstDown(game: Game, teamId: string, kind: keyof FirstDownTally): Game {
  const tally = game.firstDowns[teamId] ?? { run: 0, pass: 0, penalty: 0 }
  return {
    ...game,
    firstDowns: { ...game.firstDowns, [teamId]: { ...tally, [kind]: tally[kind] + 1 } },
  }
}

function withScore(game: Game, teamId: string, delta: number): Game {
  return { ...game, score: { ...game.score, [teamId]: (game.score[teamId] ?? 0) + delta } }
}

function appendPlay(game: Game, play: Play): Game {
  return { ...game, plays: [...game.plays, play], updatedAt: new Date().toISOString() }
}

/** Freeze the situation while a score awaits its next step (PAT/2pt choice,
 * or the kickoff that follows any score) — real down/distance resumes once
 * that step is resolved. */
function freezeForPendingScore(situation: BaseSituation): BaseSituation {
  return { ...situation, down: 1, distance: 0, distanceToGoal: 0 }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export function logRunPlay(
  game: Game,
  input: { carrierId: string; yards: number; fumbleLost: boolean },
): Game {
  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)

  if (input.fumbleLost) {
    const outcome = applyTurnover(before, opponent)
    const play: RunPlay = {
      id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
      possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: 'fumbleLost',
      type: 'run', carrierId: input.carrierId, yards: input.yards, fumbleLost: true,
    }
    return withSituation(appendPlay(game, play), outcome.situation)
  }

  const outcome = applyGain(before, input.yards, opponent)
  const play: RunPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: outcome.result,
    type: 'run', carrierId: input.carrierId, yards: input.yards, fumbleLost: false,
  }
  return finishOffensivePlay(game, play, outcome.result, before.possessionTeamId, 'run')
}

// ---------------------------------------------------------------------------
// Pass
// ---------------------------------------------------------------------------

export function logPassPlay(
  game: Game,
  input: { passerId: string; targetId: string; outcome: 'complete' | 'incomplete' | 'intercepted'; yards: number },
): Game {
  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)

  if (input.outcome === 'incomplete') {
    const after = { ...before, down: before.down + 1 }
    let situationResult: PlayResult = 'inProgress'
    let finalSituation = after
    if (before.down >= 4) {
      finalSituation = flipPossession(before, opponent, { mirror: true })
      situationResult = 'turnoverOnDowns'
    }
    const play: PassPlay = {
      id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
      possessionTeamId: before.possessionTeamId, before, after: finalSituation, result: situationResult,
      type: 'pass', passerId: input.passerId, targetId: input.targetId, outcome: 'incomplete', yards: 0,
    }
    return withSituation(appendPlay(game, play), finalSituation)
  }

  if (input.outcome === 'intercepted') {
    const outcome = applyTurnover(before, opponent)
    const play: PassPlay = {
      id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
      possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: 'interception',
      type: 'pass', passerId: input.passerId, targetId: input.targetId, outcome: 'intercepted', yards: 0,
    }
    return withSituation(appendPlay(game, play), outcome.situation)
  }

  const outcome = applyGain(before, input.yards, opponent)
  const play: PassPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: outcome.result,
    type: 'pass', passerId: input.passerId, targetId: input.targetId, outcome: 'complete', yards: input.yards,
  }
  return finishOffensivePlay(game, play, outcome.result, before.possessionTeamId, 'pass')
}

// ---------------------------------------------------------------------------
// Sack
// ---------------------------------------------------------------------------

export function logSackPlay(game: Game, input: { passerId: string; defenderId: string; yards: number }): Game {
  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)
  const outcome = applyGain(before, -Math.abs(input.yards), opponent)
  const play: SackPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: outcome.result,
    type: 'sack', passerId: input.passerId, defenderId: input.defenderId, yards: Math.abs(input.yards),
  }
  return finishOffensivePlay(game, play, outcome.result, before.possessionTeamId, null)
}

/** Shared tail for run/pass/sack: apply the resulting situation, handle a
 * touchdown or safety that emerged from yardage, and tally first downs. */
function finishOffensivePlay(
  game: Game,
  play: Play,
  result: PlayResult,
  offenseTeamId: string,
  firstDownKind: 'run' | 'pass' | null,
): Game {
  let next = appendPlay(game, play)

  if (result === 'touchdown') {
    next = withSituation(next, freezeForPendingScore(play.after))
    next = withScore(next, offenseTeamId, 6)
    next = { ...next, pendingScoreDecision: { teamId: offenseTeamId, scoringPlayId: play.id } }
    return next
  }

  if (result === 'safety') {
    const scoringTeam = otherTeamId(game, offenseTeamId)
    next = withScore(next, scoringTeam, 2)
    next = { ...next, pendingKickoff: { receivingTeamId: scoringTeam, afterSafety: true } }
    next = withSituation(next, play.after)
    return next
  }

  next = withSituation(next, play.after)

  if (result === 'firstDown' && firstDownKind) {
    next = bumpFirstDown(next, offenseTeamId, firstDownKind)
  }

  return next
}

// ---------------------------------------------------------------------------
// Penalty
// ---------------------------------------------------------------------------

export function logPenaltyPlay(
  game: Game,
  input: { penaltyTypeId: string; side: PenaltySide; yards: number },
): Game {
  const type = getPenaltyType(input.penaltyTypeId)
  if (!type) throw new Error(`Unknown penalty type: ${input.penaltyTypeId}`)

  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)
  const effect = resolvePenaltyEffect(type, input.side)
  const outcome = applyPenalty(before, input.side, input.yards, effect, opponent)

  const play: PenaltyPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after: outcome.situation, result: outcome.result,
    type: 'penalty', penaltyTypeId: type.id, penaltyName: type.name, side: input.side, yards: input.yards, effect,
  }

  let next = appendPlay(game, play)
  next = withSituation(next, outcome.situation)

  if (outcome.isFirstDown) {
    next = bumpFirstDown(next, before.possessionTeamId, 'penalty')
  }

  return next
}

// ---------------------------------------------------------------------------
// Field goal
// ---------------------------------------------------------------------------

export function logFieldGoalPlay(
  game: Game,
  input: { kickerId: string | null; made: boolean; distance: number | null },
): Game {
  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)

  const play: FieldGoalPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before,
    after: input.made ? freezeForPendingScore(before) : flipPossession(before, opponent, { mirror: true }),
    result: input.made ? 'fieldGoalGood' : 'fieldGoalMissed',
    type: 'fieldGoal', kickerId: input.kickerId, made: input.made, distance: input.distance,
  }

  let next = appendPlay(game, play)

  if (input.made) {
    next = withScore(next, before.possessionTeamId, 3)
    next = { ...next, pendingKickoff: { receivingTeamId: opponent, afterSafety: false } }
    next = withSituation(next, play.after)
    return next
  }

  return withSituation(next, play.after)
}

// ---------------------------------------------------------------------------
// Manual safety (bad snap out of the end zone, etc. — not tied to a run/sack)
// ---------------------------------------------------------------------------

export function logSafetyPlay(game: Game): Game {
  const before = currentSituation(game)
  const scoringTeam = otherTeamId(game, before.possessionTeamId)

  const play: SafetyPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after: before, result: 'safety', type: 'safety',
  }

  let next = appendPlay(game, play)
  next = withScore(next, scoringTeam, 2)
  next = { ...next, pendingKickoff: { receivingTeamId: scoringTeam, afterSafety: true } }
  return next
}

// ---------------------------------------------------------------------------
// Extra point / 2-point try (resolves pendingScoreDecision)
// ---------------------------------------------------------------------------

export function logExtraPointPlay(
  game: Game,
  input: { kind: 'kick' | 'twoPoint'; good: boolean; playerId: string | null },
): Game {
  if (!game.pendingScoreDecision) throw new Error('No touchdown is awaiting a PAT/2pt decision')
  const { teamId } = game.pendingScoreDecision
  const before = currentSituation(game)

  const play: ExtraPointPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: teamId, before, after: before, result: 'inProgress',
    type: 'extraPoint', kind: input.kind, good: input.good, playerId: input.playerId,
  }

  let next = appendPlay(game, play)
  if (input.good) {
    next = withScore(next, teamId, input.kind === 'kick' ? 1 : 2)
  }
  next = {
    ...next,
    pendingScoreDecision: null,
    pendingKickoff: { receivingTeamId: otherTeamId(game, teamId), afterSafety: false },
  }
  return next
}

// ---------------------------------------------------------------------------
// Kickoff (resolves pendingKickoff) / Punt (voluntary drive-ender)
// ---------------------------------------------------------------------------

export function logKickoffPlay(game: Game, input: { distanceToGoal?: number }): Game {
  if (!game.pendingKickoff) throw new Error('No kickoff is pending')
  const { receivingTeamId, afterSafety } = game.pendingKickoff
  const before = currentSituation(game)
  const spot = input.distanceToGoal ?? KICKOFF_TOUCHBACK_SPOT
  const after: BaseSituation = {
    quarter: before.quarter,
    possessionTeamId: receivingTeamId,
    down: 1,
    distance: Math.min(10, spot),
    distanceToGoal: spot,
  }

  const play: KickoffPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: receivingTeamId, before, after, result: 'inProgress', type: 'kickoff', afterSafety,
  }

  let next = appendPlay(game, play)
  next = { ...next, pendingKickoff: null }
  return withSituation(next, after)
}

export function logPuntPlay(game: Game, input: { receivingDistanceToGoal: number }): Game {
  const before = currentSituation(game)
  const opponent = otherTeamId(game, before.possessionTeamId)
  const spot = Math.max(1, Math.min(99, input.receivingDistanceToGoal))
  const after: BaseSituation = { quarter: before.quarter, possessionTeamId: opponent, down: 1, distance: Math.min(10, spot), distanceToGoal: spot }

  const play: PuntPlay = {
    id: makeId('play'), createdAt: new Date().toISOString(), quarter: before.quarter,
    possessionTeamId: before.possessionTeamId, before, after, result: 'inProgress', type: 'punt',
  }

  return withSituation(appendPlay(game, play), after)
}

/** Suggested landing spot for a punt from the current line of scrimmage,
 * assuming a ~35-yard net punt. Editable by the operator before confirming. */
export function suggestedPuntSpot(game: Game): number {
  const netPunt = 35
  const spotFromReceivingGoal = Math.max(game.distanceToGoal - netPunt, 0)
  return spotFromReceivingGoal <= 0 ? KICKOFF_TOUCHBACK_SPOT : 100 - spotFromReceivingGoal
}

// ---------------------------------------------------------------------------
// Undo (pop the last play and recompute situation/score from the log)
// ---------------------------------------------------------------------------

export function undoLastPlay(game: Game): Game {
  if (game.plays.length === 0) return game
  const plays = game.plays.slice(0, -1)
  return recomputeFromPlays({ ...game, plays })
}

/** Rebuild derived situation/score/firstDowns/pending-state from the play
 * log. Used by undo, and safe to call any time the log is the source of
 * truth and everything else needs to be regenerated from it. */
export function recomputeFromPlays(game: Game): Game {
  let g: Game = {
    ...game,
    plays: [],
    score: { [game.teamA.id]: 0, [game.teamB.id]: 0 },
    possessionTeamId: game.teamA.id,
    quarter: 1,
    down: 1,
    distance: 10,
    distanceToGoal: KICKOFF_TOUCHBACK_SPOT,
    firstDowns: { [game.teamA.id]: { run: 0, pass: 0, penalty: 0 }, [game.teamB.id]: { run: 0, pass: 0, penalty: 0 } },
    pendingScoreDecision: null,
    pendingKickoff: null,
  }

  for (const play of game.plays) {
    switch (play.type) {
      case 'run':
        g = logRunPlay(g, { carrierId: play.carrierId, yards: play.yards, fumbleLost: play.fumbleLost })
        break
      case 'pass':
        g = logPassPlay(g, { passerId: play.passerId, targetId: play.targetId, outcome: play.outcome, yards: play.yards })
        break
      case 'sack':
        g = logSackPlay(g, { passerId: play.passerId, defenderId: play.defenderId, yards: play.yards })
        break
      case 'penalty':
        g = logPenaltyPlay(g, { penaltyTypeId: play.penaltyTypeId, side: play.side, yards: play.yards })
        break
      case 'fieldGoal':
        g = logFieldGoalPlay(g, { kickerId: play.kickerId, made: play.made, distance: play.distance })
        break
      case 'safety':
        g = logSafetyPlay(g)
        break
      case 'extraPoint':
        g = logExtraPointPlay(g, { kind: play.kind, good: play.good, playerId: play.playerId })
        break
      case 'kickoff':
        g = logKickoffPlay(g, { distanceToGoal: play.after.distanceToGoal })
        break
      case 'punt':
        g = logPuntPlay(g, { receivingDistanceToGoal: play.after.distanceToGoal })
        break
    }
  }

  return g
}
