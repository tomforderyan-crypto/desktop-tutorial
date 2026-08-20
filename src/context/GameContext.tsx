import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Game } from '../types'
import { loadGame, saveGame } from '../storage/gameRepository'

interface GameContextValue {
  game: Game
  setGame: (updater: Game | ((g: Game) => Game)) => void
}

const GameContext = createContext<GameContextValue | null>(null)

// Keyed by gameId at the call site (see App.tsx's GameRoute) so switching
// games remounts this provider instead of needing an effect to re-sync it.
export function GameProvider({ gameId, children }: { gameId: string; children: ReactNode }) {
  const [game, setGameState] = useState<Game | null>(() => loadGame(gameId))

  const setGame = useCallback((updater: Game | ((g: Game) => Game)) => {
    setGameState((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? (updater as (g: Game) => Game)(prev) : updater
      saveGame(next)
      return next
    })
  }, [])

  if (!game) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-[var(--color-text-muted)]">
        Couldn't find that game — it may have been cleared from this browser's storage.
      </div>
    )
  }

  return <GameContext.Provider value={{ game, setGame }}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
