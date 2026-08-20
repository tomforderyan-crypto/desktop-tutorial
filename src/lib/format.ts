export function ordinal(n: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }
  const mod100 = n % 100
  return `${n}${suffixes[mod100] ?? suffixes[n % 10] ?? 'th'}`
}

export function downAndDistance(down: number, distance: number, distanceToGoal: number): string {
  if (distanceToGoal <= distance) return `${ordinal(down)} & Goal`
  return `${ordinal(down)} & ${distance}`
}

/** Friendly "ball on" description — doesn't track literal team sides, just
 * whether the possessing team is in their own or the opponent's half. */
export function ballSpot(distanceToGoal: number): string {
  if (distanceToGoal <= 50) return `Opp ${distanceToGoal}`
  return `Own ${100 - distanceToGoal}`
}

export function signedYards(yards: number): string {
  if (yards > 0) return `+${yards}`
  return `${yards}`
}
