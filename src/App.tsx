import type { ReactNode } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NewGamePage from './pages/NewGamePage'
import LineupPage from './pages/LineupPage'
import LiveGamePage from './pages/LiveGamePage'
import BoxScorePage from './pages/BoxScorePage'
import { GameProvider } from './context/GameContext'

function GameRoute({ children }: { children: ReactNode }) {
  const { gameId } = useParams()
  if (!gameId) return null
  return (
    <GameProvider key={gameId} gameId={gameId}>
      {children}
    </GameProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewGamePage />} />
        <Route
          path="/game/:gameId/lineup"
          element={
            <GameRoute>
              <LineupPage />
            </GameRoute>
          }
        />
        <Route
          path="/game/:gameId/live"
          element={
            <GameRoute>
              <LiveGamePage />
            </GameRoute>
          }
        />
        <Route
          path="/game/:gameId/box"
          element={
            <GameRoute>
              <BoxScorePage />
            </GameRoute>
          }
        />
      </Route>
    </Routes>
  )
}
