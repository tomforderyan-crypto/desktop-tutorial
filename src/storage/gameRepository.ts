import type { Game, GameSummary } from '../types'

// A thin repository over localStorage. Every read/write goes through here so
// swapping in a real backend later only means rewriting this file — nothing
// else in the app talks to storage directly.

const INDEX_KEY = 'fieldside:games:index'
const gameKey = (id: string) => `fieldside:game:${id}`

function readIndex(): GameSummary[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as GameSummary[]) : []
  } catch {
    return []
  }
}

function writeIndex(index: GameSummary[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index))
}

function toSummary(game: Game): GameSummary {
  return {
    id: game.id,
    createdAt: game.createdAt,
    status: game.status,
    teamAName: game.teamA.name,
    teamBName: game.teamB.name,
    scoreA: game.score[game.teamA.id] ?? 0,
    scoreB: game.score[game.teamB.id] ?? 0,
  }
}

export function listGames(): GameSummary[] {
  return [...readIndex()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function loadGame(id: string): Game | null {
  try {
    const raw = localStorage.getItem(gameKey(id))
    return raw ? (JSON.parse(raw) as Game) : null
  } catch {
    return null
  }
}

export function saveGame(game: Game): void {
  localStorage.setItem(gameKey(game.id), JSON.stringify(game))
  const index = readIndex()
  const pos = index.findIndex((g) => g.id === game.id)
  const summary = toSummary(game)
  if (pos === -1) {
    writeIndex([...index, summary])
  } else {
    const next = [...index]
    next[pos] = summary
    writeIndex(next)
  }
}

export function deleteGame(id: string): void {
  localStorage.removeItem(gameKey(id))
  writeIndex(readIndex().filter((g) => g.id !== id))
}
