import type { BaseSituation, PenaltyEffect, PenaltySide, PlayResult } from '../types'

/** Default field position (yards from the end zone) a team starts a fresh
 * drive at after a kickoff/free-kick touchback — the HS-typical own 20. */
export const KICKOFF_TOUCHBACK_SPOT = 80

export interface SituationOutcome {
  situation: BaseSituation
  result: PlayResult
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function lineToGain(distanceToGoal: number, distance: number): number {
  // "Goal to go": you can never need more yards than there are left to score.
  return Math.min(distance, distanceToGoal)
}

/** Flip possession to the other team. `mirror` reflects the physical spot on
 * the field (turnover / missed FG / turnover on downs); otherwise the drive
 * restarts fresh at `resetSpot` (post-score kickoff or safety free kick). */
export function flipPossession(
  situation: BaseSituation,
  otherTeamId: string,
  opts: { mirror: boolean; resetSpot?: number },
): BaseSituation {
  const distanceToGoal = opts.mirror
    ? clamp(100 - situation.distanceToGoal, 1, 99)
    : clamp(opts.resetSpot ?? KICKOFF_TOUCHBACK_SPOT, 1, 99)
  return {
    quarter: situation.quarter,
    possessionTeamId: otherTeamId,
    down: 1,
    distance: lineToGain(distanceToGoal, 10),
    distanceToGoal,
  }
}

/** Apply a straightforward yardage gain/loss (run, pass reception, sack) by
 * the possessing team. Positive yards move them toward the opponent's goal. */
export function applyGain(
  situation: BaseSituation,
  yards: number,
  otherTeamId: string,
): SituationOutcome {
  const rawDistanceToGoal = situation.distanceToGoal - yards

  if (rawDistanceToGoal <= 0) {
    return {
      situation: { ...situation, distanceToGoal: 0, distance: 0 },
      result: 'touchdown',
    }
  }

  if (rawDistanceToGoal >= 100) {
    return {
      situation: { ...situation, distanceToGoal: 100, distance: situation.distance },
      result: 'safety',
    }
  }

  const remainingDistance = situation.distance - yards
  if (remainingDistance <= 0) {
    return {
      situation: {
        ...situation,
        distanceToGoal: rawDistanceToGoal,
        down: 1,
        distance: lineToGain(rawDistanceToGoal, 10),
      },
      result: 'firstDown',
    }
  }

  if (situation.down >= 4) {
    return {
      situation: flipPossession({ ...situation, distanceToGoal: rawDistanceToGoal }, otherTeamId, { mirror: true }),
      result: 'turnoverOnDowns',
    }
  }

  return {
    situation: { ...situation, distanceToGoal: rawDistanceToGoal, down: situation.down + 1, distance: remainingDistance },
    result: yards === 0 ? 'noGain' : 'inProgress',
  }
}

/** Apply a change-of-possession play (interception, fumble lost) at the spot
 * the ball was at when it turned over — no yardage applied beyond that. */
export function applyTurnover(situation: BaseSituation, otherTeamId: string): SituationOutcome {
  return { situation: flipPossession(situation, otherTeamId, { mirror: true }), result: 'inProgress' }
}

export interface PenaltyOutcome extends SituationOutcome {
  isFirstDown: boolean
}

/** Apply a penalty's yardage + down effect. `side` is relative to the team
 * currently on offense (the possession team in `situation`). */
export function applyPenalty(
  situation: BaseSituation,
  side: PenaltySide,
  yards: number,
  effect: PenaltyEffect,
  otherTeamId: string,
): PenaltyOutcome {
  if (side === 'offense') {
    // Pushed back toward their own goal line — cap at half the distance
    // remaining to that goal line so a penalty can never force a safety.
    const distFromOwnGoal = 100 - situation.distanceToGoal
    const applied = Math.min(yards, Math.floor(distFromOwnGoal / 2))
    const distanceToGoal = clamp(situation.distanceToGoal + applied, 1, 99)
    const distance = clamp(situation.distance + applied, 1, lineToGain(distanceToGoal, 99))

    if (effect === 'lossOfDown') {
      if (situation.down >= 4) {
        return {
          situation: flipPossession({ ...situation, distanceToGoal }, otherTeamId, { mirror: true }),
          result: 'turnoverOnDowns',
          isFirstDown: false,
        }
      }
      return {
        situation: { ...situation, distanceToGoal, distance, down: situation.down + 1 },
        result: 'inProgress',
        isFirstDown: false,
      }
    }

    return { situation: { ...situation, distanceToGoal, distance }, result: 'penaltyOffset', isFirstDown: false }
  }

  // Defense fouled — offense moves toward the opponent's goal line, capped
  // at half the distance remaining to that goal line.
  const applied = Math.min(yards, Math.floor(situation.distanceToGoal / 2))
  const distanceToGoal = clamp(situation.distanceToGoal - applied, 1, 99)
  const yardageCrossedSticks = situation.distance - applied <= 0

  if (effect === 'automaticFirstDown' || yardageCrossedSticks) {
    return {
      situation: { ...situation, distanceToGoal, down: 1, distance: lineToGain(distanceToGoal, 10) },
      result: 'firstDown',
      isFirstDown: true,
    }
  }

  return {
    situation: { ...situation, distanceToGoal, distance: situation.distance - applied },
    result: 'penaltyOffset',
    isFirstDown: false,
  }
}
