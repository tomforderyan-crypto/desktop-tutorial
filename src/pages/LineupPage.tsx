import { useNavigate, useParams } from 'react-router-dom'
import type { LineupGroup, Team } from '../types'
import { useGame } from '../context/GameContext'
import { Button, Card, Label, Select } from '../components/ui'
import { makeId } from '../lib/id'

const GROUPS: LineupGroup[] = ['QB', 'RB', 'WR', 'TE', 'OL']

function TeamLineupEditor({ team }: { team: Team }) {
  const { game, setGame } = useGame()
  const lineup = game.lineups[team.id]

  const setSlotPlayer = (slotId: string, playerId: string) => {
    setGame((g) => ({
      ...g,
      lineups: {
        ...g.lineups,
        [team.id]: {
          ...g.lineups[team.id],
          slots: g.lineups[team.id].slots.map((s) => (s.id === slotId ? { ...s, playerId: playerId || null } : s)),
        },
      },
    }))
  }

  const addSlot = (group: LineupGroup) => {
    const count = lineup.slots.filter((s) => s.group === group).length
    setGame((g) => ({
      ...g,
      lineups: {
        ...g.lineups,
        [team.id]: {
          ...g.lineups[team.id],
          slots: [...g.lineups[team.id].slots, { id: makeId('slot'), group, label: `${group}${count + 1}`, playerId: null }],
        },
      },
    }))
  }

  const removeSlot = (slotId: string) => {
    setGame((g) => ({
      ...g,
      lineups: {
        ...g.lineups,
        [team.id]: { ...g.lineups[team.id], slots: g.lineups[team.id].slots.filter((s) => s.id !== slotId) },
      },
    }))
  }

  const takenElsewhere = (playerId: string, slotId: string) =>
    lineup.slots.some((s) => s.id !== slotId && s.playerId === playerId)

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-2xl tracking-wide">{team.name}</h2>
      {GROUPS.map((group) => (
        <div key={group} className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">{group}</Label>
            <button
              type="button"
              onClick={() => addSlot(group)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-amber-soft)]"
            >
              + add {group}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {lineup.slots
              .filter((s) => s.group === group)
              .map((slot) => (
                <div key={slot.id} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 font-mono text-xs text-[var(--color-text-dim)]">{slot.label}</span>
                  <Select value={slot.playerId ?? ''} onChange={(e) => setSlotPlayer(slot.id, e.target.value)} className="flex-1">
                    <option value="">— empty —</option>
                    {team.roster.map((p) => (
                      <option key={p.id} value={p.id} disabled={takenElsewhere(p.id, slot.id)}>
                        #{p.number} {p.name} {takenElsewhere(p.id, slot.id) ? '(in another slot)' : ''}
                      </option>
                    ))}
                  </Select>
                  {group !== 'QB' && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="text-[var(--color-text-dim)] hover:text-[var(--color-bad)]"
                      aria-label="Remove slot"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </Card>
  )
}

export default function LineupPage() {
  const { game, setGame } = useGame()
  const navigate = useNavigate()
  const { gameId } = useParams()
  const isInitialSetup = game.status === 'lineup'

  const qbSet = (teamId: string) => game.lineups[teamId].slots.some((s) => s.group === 'QB' && s.playerId)
  const readyToStart = qbSet(game.teamA.id) && qbSet(game.teamB.id)

  const start = () => {
    setGame((g) => ({ ...g, status: 'live' }))
    navigate(`/game/${gameId}/live`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 font-display text-4xl tracking-wide">{isInitialSetup ? 'Starting Lineup' : 'Substitutions'}</h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Set who's at each offensive position. Plays log against whoever's in the slot at the time — swap freely mid-drive
        without touching stat history already recorded.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamLineupEditor team={game.teamA} />
        <TeamLineupEditor team={game.teamB} />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {isInitialSetup ? (
          <Button variant="primary" size="lg" onClick={start} disabled={!readyToStart}>
            Start Game →
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => navigate(`/game/${gameId}/live`)}>
            Back to Live Game →
          </Button>
        )}
      </div>
    </div>
  )
}
