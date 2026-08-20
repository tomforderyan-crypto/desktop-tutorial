// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

/** Raw position abbreviation, as it would appear on a roster page. Kept as a
 * loose string union of common HS labels rather than a closed enum, since
 * roster imports will surface variants (e.g. "OL" vs "OT" vs "C"). */
export type RosterPosition =
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE' | 'OL' | 'OT' | 'OG' | 'C'
  | 'DL' | 'DE' | 'DT' | 'NG' | 'LB' | 'CB' | 'S' | 'DB'
  | 'K' | 'P' | 'ATH' | 'OTHER'

export interface Player {
  id: string
  number: string
  name: string
  position: RosterPosition
  /** Raw position text as scraped/entered, before mapping to RosterPosition. */
  rawPosition?: string
}

export interface Team {
  id: string
  name: string
  roster: Player[]
}

// ---------------------------------------------------------------------------
// Lineup (offense-only for v1; shaped so a defensive lineup can slot in later)
// ---------------------------------------------------------------------------

export type LineupGroup = 'QB' | 'RB' | 'WR' | 'TE' | 'OL'

export interface LineupSlot {
  id: string
  group: LineupGroup
  /** Display label for the slot, e.g. "QB", "RB1", "WR2". */
  label: string
  playerId: string | null
}

export interface TeamLineup {
  teamId: string
  slots: LineupSlot[]
}

// ---------------------------------------------------------------------------
// Penalties
// ---------------------------------------------------------------------------

export type PenaltyEffect = 'repeatDown' | 'lossOfDown' | 'automaticFirstDown'
export type PenaltySide = 'offense' | 'defense'

export interface PenaltyType {
  id: string
  name: string
  defaultYards: number
  effect: PenaltyEffect
  /** Which side this penalty is typically called against. Editable at entry time. */
  defaultSide: PenaltySide
}

// ---------------------------------------------------------------------------
// Plays
// ---------------------------------------------------------------------------

export type PlayResult =
  | 'inProgress'
  | 'firstDown'
  | 'touchdown'
  | 'turnoverOnDowns'
  | 'interception'
  | 'fumbleLost'
  | 'safety'
  | 'noGain'
  | 'penaltyOffset'
  | 'fieldGoalGood'
  | 'fieldGoalMissed'

export interface BaseSituation {
  quarter: number
  possessionTeamId: string
  down: number
  distance: number
  /** Yards the possession team must travel to score, 0 (in the end zone) to 100 (own goal line). */
  distanceToGoal: number
}

interface PlayBase {
  id: string
  createdAt: string
  quarter: number
  possessionTeamId: string
  before: BaseSituation
  after: BaseSituation
  result: PlayResult
}

export interface RunPlay extends PlayBase {
  type: 'run'
  carrierId: string
  yards: number
  fumbleLost: boolean
}

export interface PassPlay extends PlayBase {
  type: 'pass'
  passerId: string
  targetId: string
  outcome: 'complete' | 'incomplete' | 'intercepted'
  /** Total yards gained on the reception (0 for incomplete/intercepted). */
  yards: number
}

export interface SackPlay extends PlayBase {
  type: 'sack'
  passerId: string
  defenderId: string
  /** Positive number of yards lost. */
  yards: number
}

export interface PenaltyPlay extends PlayBase {
  type: 'penalty'
  penaltyTypeId: string
  penaltyName: string
  side: PenaltySide
  yards: number
  effect: PenaltyEffect
}

export interface FieldGoalPlay extends PlayBase {
  type: 'fieldGoal'
  kickerId: string | null
  made: boolean
  distance: number | null
}

export interface SafetyPlay extends PlayBase {
  type: 'safety'
}

export interface ExtraPointPlay extends PlayBase {
  type: 'extraPoint'
  kind: 'kick' | 'twoPoint'
  good: boolean
  /** For a 2pt try, who scored (carrier or receiver). Optional either way. */
  playerId: string | null
}

export interface KickoffPlay extends PlayBase {
  type: 'kickoff'
  /** True when this is a free kick after a safety rather than a post-score kickoff. */
  afterSafety: boolean
}

export interface PuntPlay extends PlayBase {
  type: 'punt'
}

export type Play =
  | RunPlay
  | PassPlay
  | SackPlay
  | PenaltyPlay
  | FieldGoalPlay
  | SafetyPlay
  | ExtraPointPlay
  | KickoffPlay
  | PuntPlay

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------

export type GameStatus = 'setup' | 'lineup' | 'live' | 'final'

export interface FirstDownTally {
  run: number
  pass: number
  penalty: number
}

export interface PendingScoreDecision {
  /** teamId that just scored a touchdown and needs a PAT/2pt decision. */
  teamId: string
  scoringPlayId: string
}

export interface PendingKickoff {
  /** teamId that must receive the upcoming kickoff. */
  receivingTeamId: string
  afterSafety: boolean
}

export interface Game {
  id: string
  createdAt: string
  updatedAt: string
  status: GameStatus
  teamA: Team
  teamB: Team
  lineups: Record<string, TeamLineup>
  plays: Play[]
  score: Record<string, number>
  possessionTeamId: string
  quarter: number
  down: number
  distance: number
  distanceToGoal: number
  firstDowns: Record<string, FirstDownTally>
  pendingScoreDecision: PendingScoreDecision | null
  pendingKickoff: PendingKickoff | null
  /** Milestone keys already fired, so each only alerts once per game. */
  firedMilestones: string[]
}

// ---------------------------------------------------------------------------
// Past-game index (lightweight list for the Home screen)
// ---------------------------------------------------------------------------

export interface GameSummary {
  id: string
  createdAt: string
  status: GameStatus
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
}
