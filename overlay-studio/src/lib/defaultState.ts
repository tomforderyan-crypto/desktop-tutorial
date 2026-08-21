import type { StudioState } from '../types'

export function makeDefaultState(): StudioState {
  return {
    scoreboard: {
      visible: true,
      home: { name: 'Home', abbreviation: 'HOME', color: '#7c5cff', logoUrl: '', score: 0, timeouts: 3 },
      away: { name: 'Away', abbreviation: 'AWAY', color: '#35d7d0', logoUrl: '', score: 0, timeouts: 3 },
      period: 'Q1',
      clock: '12:00',
      possession: null,
      downDistance: '',
    },
    playClock: {
      visible: false,
      duration: 25,
      secondsRemaining: 25,
      running: false,
      updatedAt: Date.now(),
    },
    watermark: {
      visible: false,
      logoUrl: '',
      text: '',
      position: 'top-right',
    },
    ticker: {
      visible: false,
      headline: 'LIVE',
      items: [],
      speedSec: 25,
      source: 'manual',
      dataTemplate: '',
    },
    dataSource: {
      mode: 'none',
      jsonText: '',
      sheetCsvUrl: '',
      lastFetchedAt: null,
      lastError: null,
    },
    rosterData: [],
  }
}
