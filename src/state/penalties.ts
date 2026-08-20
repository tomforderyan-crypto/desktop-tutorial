import type { PenaltyEffect, PenaltySide, PenaltyType } from '../types'

/** Standard high school (NFHS) football penalties. Yardage and effect are
 * sensible defaults for live entry — the operator can still edit the yardage
 * on the entry form since actual enforcement spots vary play to play.
 *
 * Most fouls only ever get called on one side, so `sideLocked` hides the
 * side picker for those. "Personal Foul" and "Unsportsmanlike Conduct" can
 * go either way, so they stay editable — and since a first down is only ever
 * automatic when the *defense* is fouling, `effect` for those two is resolved
 * per-entry from the chosen side rather than fixed on the type (see
 * `resolvePenaltyEffect`). */
export const PENALTY_TYPES: PenaltyType[] = [
  // --- Offense, pre-snap / procedural ---
  { id: 'false-start', name: 'False Start', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'delay-of-game', name: 'Delay of Game', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'illegal-formation', name: 'Illegal Formation', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'illegal-motion', name: 'Illegal Motion', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'illegal-substitution', name: 'Illegal Substitution', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },

  // --- Offense, during the play ---
  { id: 'offensive-holding', name: 'Offensive Holding', defaultYards: 10, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'illegal-use-of-hands', name: 'Illegal Use of Hands', defaultYards: 10, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'illegal-block-in-back', name: 'Illegal Block in the Back', defaultYards: 10, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'chop-block', name: 'Chop Block', defaultYards: 15, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'ineligible-downfield', name: 'Ineligible Receiver Downfield', defaultYards: 5, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'offensive-pass-interference', name: 'Offensive Pass Interference', defaultYards: 10, effect: 'repeatDown', defaultSide: 'offense' },
  { id: 'intentional-grounding', name: 'Intentional Grounding', defaultYards: 5, effect: 'lossOfDown', defaultSide: 'offense' },

  // --- Defense ---
  { id: 'offside', name: 'Offside / Encroachment', defaultYards: 5, effect: 'repeatDown', defaultSide: 'defense' },
  { id: 'neutral-zone', name: 'Neutral Zone Infraction', defaultYards: 5, effect: 'repeatDown', defaultSide: 'defense' },
  { id: 'defensive-holding', name: 'Defensive Holding', defaultYards: 5, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'illegal-contact', name: 'Illegal Contact', defaultYards: 5, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'defensive-pass-interference', name: 'Defensive Pass Interference', defaultYards: 15, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'roughing-the-passer', name: 'Roughing the Passer', defaultYards: 15, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'roughing-the-kicker', name: 'Roughing the Kicker', defaultYards: 15, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'facemask', name: 'Facemask', defaultYards: 15, effect: 'automaticFirstDown', defaultSide: 'defense' },
  { id: 'targeting', name: 'Targeting', defaultYards: 15, effect: 'automaticFirstDown', defaultSide: 'defense' },

  // --- Either side ---
  { id: 'unsportsmanlike-conduct', name: 'Unsportsmanlike Conduct', defaultYards: 15, effect: 'repeatDown', defaultSide: 'defense' },
  { id: 'personal-foul', name: 'Personal Foul', defaultYards: 15, effect: 'repeatDown', defaultSide: 'defense' },
]

const SIDE_FLEXIBLE_IDS = new Set(['unsportsmanlike-conduct', 'personal-foul'])

export function isPenaltySideLocked(penalty: PenaltyType): boolean {
  return !SIDE_FLEXIBLE_IDS.has(penalty.id)
}

/** A first down is only ever automatic when the *defense* commits the foul —
 * for the side-flexible penalty types, resolve the real effect from the
 * side actually chosen at entry time rather than the type's stored default. */
export function resolvePenaltyEffect(penalty: PenaltyType, side: PenaltySide): PenaltyEffect {
  if (!SIDE_FLEXIBLE_IDS.has(penalty.id)) return penalty.effect
  return side === 'defense' ? 'automaticFirstDown' : 'repeatDown'
}

export function getPenaltyType(id: string): PenaltyType | undefined {
  return PENALTY_TYPES.find((p) => p.id === id)
}
