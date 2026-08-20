import type { Player, RosterPosition } from '../types'

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 0 ? parts[parts.length - 1] : name
}

function byLastName(a: Player, b: Player): number {
  return lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name)
}

/** Priority positions surface first (in last-name order among themselves),
 * everyone else follows, also alphabetical by last name. This is the
 * suggestion order used to keep live play entry fast. */
export function orderByPriority(roster: Player[], priorityPositions: RosterPosition[]): Player[] {
  const priority = new Set(priorityPositions)
  const first = roster.filter((p) => priority.has(p.position)).sort(byLastName)
  const rest = roster.filter((p) => !priority.has(p.position)).sort(byLastName)
  return [...first, ...rest]
}

export const orderForRunCarrier = (roster: Player[]): Player[] => orderByPriority(roster, ['RB', 'FB', 'QB'])
export const orderForPasser = (roster: Player[]): Player[] => orderByPriority(roster, ['QB'])
export const orderForTarget = (roster: Player[]): Player[] => orderByPriority(roster, ['WR', 'TE'])
export const orderForDefender = (roster: Player[]): Player[] =>
  orderByPriority(roster, ['DL', 'DE', 'DT', 'NG', 'LB'])
export const orderAlphabetical = (roster: Player[]): Player[] => [...roster].sort(byLastName)
