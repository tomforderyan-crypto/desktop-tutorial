export type OverlayKind = 'scoreboard' | 'watermark' | 'playclock' | 'ticker'

export interface TeamInfo {
  name: string
  abbreviation: string
  color: string
  logoUrl: string
  score: number
  timeouts: number
}

export interface ScoreboardState {
  visible: boolean
  home: TeamInfo
  away: TeamInfo
  period: string
  clock: string
  possession: 'home' | 'away' | null
  downDistance: string
}

export interface PlayClockState {
  visible: boolean
  duration: number
  secondsRemaining: number
  running: boolean
  updatedAt: number
}

export interface WatermarkState {
  visible: boolean
  logoUrl: string
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface TickerItem {
  id: string
  text: string
}

export interface TickerState {
  visible: boolean
  headline: string
  items: TickerItem[]
  speedSec: number
  source: 'manual' | 'data'
  dataTemplate: string
}

export type DataSourceMode = 'none' | 'json' | 'sheet'

export interface DataSourceState {
  mode: DataSourceMode
  jsonText: string
  sheetCsvUrl: string
  lastFetchedAt: number | null
  lastError: string | null
}

export type RosterRow = Record<string, string>

export interface StudioState {
  scoreboard: ScoreboardState
  playClock: PlayClockState
  watermark: WatermarkState
  ticker: TickerState
  dataSource: DataSourceState
  rosterData: RosterRow[]
}
