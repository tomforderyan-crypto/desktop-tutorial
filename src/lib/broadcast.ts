import type { Game, RosterPosition, Team } from '../types'
import { deriveStats } from './stats'

// The shape written to stats.json / POSTed to the overlay bridge server
// (server/broadcast-server.mjs) every time the game changes. Stat lines are
// pre-formatted (label + display value, in display order) so the overlay
// only has to render them, not recompute anything.

export type BroadcastCategory = 'passing' | 'rushing' | 'receiving' | 'defense'

export interface BroadcastStatEntry {
  label: string
  value: string
}

export interface BroadcastTeam {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
}

export interface BroadcastPlayer {
  id: string
  name: string
  number: string
  position: RosterPosition
  teamId: string
  category: BroadcastCategory | null
  statLine: BroadcastStatEntry[]
}

export interface BroadcastState {
  gameId: string
  updatedAt: string
  teams: BroadcastTeam[]
  players: BroadcastPlayer[]
}

const DEFENSE_POSITIONS: RosterPosition[] = ['DL', 'DE', 'DT', 'NG', 'LB', 'CB', 'S', 'DB']

function categoryForPosition(position: RosterPosition): BroadcastCategory | null {
  if (position === 'QB') return 'passing'
  if (position === 'RB' || position === 'FB') return 'rushing'
  if (position === 'WR' || position === 'TE') return 'receiving'
  if (DEFENSE_POSITIONS.includes(position)) return 'defense'
  return null
}

function teamToBroadcast(team: Team): BroadcastTeam {
  return { id: team.id, name: team.name, primaryColor: team.primaryColor, secondaryColor: team.secondaryColor }
}

/** Converts a Game into the flat JSON shape the overlay/control panel need.
 * `deriveStats` (src/lib/stats.ts) is still the single source of truth for
 * numbers — this only selects and formats which line each player shows. */
export function toBroadcastState(game: Game): BroadcastState {
  const lines = deriveStats(game.plays)
  const players: BroadcastPlayer[] = []

  for (const team of [game.teamA, game.teamB]) {
    for (const player of team.roster) {
      const category = categoryForPosition(player.position)
      const line = lines.get(player.id)
      let statLine: BroadcastStatEntry[] = []

      if (category === 'passing') {
        const p = line?.passing
        statLine = [
          { label: 'C/ATT', value: `${p?.completions ?? 0}/${p?.attempts ?? 0}` },
          { label: 'YDS', value: String(p?.yards ?? 0) },
          { label: 'TD', value: String(p?.touchdowns ?? 0) },
          { label: 'INT', value: String(p?.interceptions ?? 0) },
        ]
      } else if (category === 'rushing') {
        const r = line?.rushing
        const carries = r?.carries ?? 0
        const yards = r?.yards ?? 0
        statLine = [
          { label: 'CAR', value: String(carries) },
          { label: 'YDS', value: String(yards) },
          { label: 'YPC', value: (carries > 0 ? yards / carries : 0).toFixed(1) },
          { label: 'TD', value: String(r?.touchdowns ?? 0) },
        ]
      } else if (category === 'receiving') {
        const r = line?.receiving
        statLine = [
          { label: 'REC', value: String(r?.receptions ?? 0) },
          { label: 'YDS', value: String(r?.yards ?? 0) },
          { label: 'TD', value: String(r?.touchdowns ?? 0) },
        ]
      } else if (category === 'defense') {
        // Tackles and defender-attributed interceptions aren't tracked by
        // the play log yet — only sacks are, so that's all this shows.
        statLine = [{ label: 'SACK', value: String(line?.defense.sacks ?? 0) }]
      }

      players.push({
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
        teamId: team.id,
        category,
        statLine,
      })
    }
  }

  return {
    gameId: game.id,
    updatedAt: new Date().toISOString(),
    teams: [teamToBroadcast(game.teamA), teamToBroadcast(game.teamB)],
    players,
  }
}

export const BROADCAST_HTTP_BASE = (import.meta.env.VITE_BROADCAST_URL as string | undefined) || 'http://localhost:8787'
export const BROADCAST_WS_BASE = BROADCAST_HTTP_BASE.replace(/^http/, 'ws')

let pushTimer: ReturnType<typeof setTimeout> | null = null
let pendingGame: Game | null = null

function doPush(game: Game): void {
  fetch(`${BROADCAST_HTTP_BASE}/api/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toBroadcastState(game)),
  }).catch(() => {
    // Overlay bridge server isn't running — the tracker still works standalone.
  })
}

/** Debounced push so a burst of edits (typing a hex color, undo/redo) only
 * sends the server one request instead of one per keystroke. */
export function pushBroadcastState(game: Game): void {
  pendingGame = game
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    if (pendingGame) doPush(pendingGame)
    pendingGame = null
    pushTimer = null
  }, 200)
}
