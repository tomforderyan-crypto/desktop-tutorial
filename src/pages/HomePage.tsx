import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGames } from '../storage/gameRepository'
import { Button, Card } from '../components/ui'
import { format } from 'date-fns'

export default function HomePage() {
  const navigate = useNavigate()
  const games = useMemo(() => listGames(), [])

  const resumePath = (status: string, id: string) => {
    if (status === 'final') return `/game/${id}/box`
    if (status === 'live') return `/game/${id}/live`
    return `/game/${id}/lineup`
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-6xl tracking-wide text-[var(--color-text)]">FIELDSIDE</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Live football stat tracking, built for one operator on air.</p>
      </div>

      <div className="mb-10 flex justify-center">
        <Button variant="primary" size="lg" onClick={() => navigate('/new')}>
          + Start New Game
        </Button>
      </div>

      <h2 className="mb-3 font-display text-2xl tracking-wide text-[var(--color-text-muted)]">Past Games</h2>
      {games.length === 0 ? (
        <Card className="p-6 text-center text-sm text-[var(--color-text-dim)]">
          No games yet — start one above to build your first roster and play log.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(resumePath(g.status, g.id))}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--color-amber)]/50"
            >
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  {g.teamAName} <span className="text-[var(--color-text-dim)]">vs</span> {g.teamBName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {format(new Date(g.createdAt), 'MMM d, yyyy')} · {g.status === 'final' ? 'Final' : g.status === 'live' ? 'In progress' : 'Not started'}
                </p>
              </div>
              <p className="font-mono text-xl text-[var(--color-amber-soft)]">
                {g.scoreA}–{g.scoreB}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
