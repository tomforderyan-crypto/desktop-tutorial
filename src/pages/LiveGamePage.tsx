import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { PenaltySide } from '../types'
import { useGame } from '../context/GameContext'
import { Scoreboard } from '../components/Scoreboard'
import { MilestoneToasts } from '../components/MilestoneToasts'
import { LeadersPanel } from '../components/LeadersPanel'
import { PlayerPicker } from '../components/PlayerPicker'
import { Button, Card, Label, NumberStepper, Select } from '../components/ui'
import {
  logRunPlay, logPassPlay, logSackPlay, logPenaltyPlay, logFieldGoalPlay,
  logSafetyPlay, logExtraPointPlay, logKickoffPlay, logPuntPlay,
  otherTeamId, undoLastPlay, suggestedPuntSpot,
} from '../state/gameEngine'
import { orderForRunCarrier, orderForPasser, orderForTarget, orderForDefender, orderByPriority } from '../lib/playerSuggest'
import { PENALTY_TYPES, isPenaltySideLocked, getPenaltyType } from '../state/penalties'
import { describePlay } from '../lib/describePlay'

type PlayType = 'run' | 'pass' | 'sack' | 'penalty' | 'fieldGoal' | 'safety' | 'punt'

const PLAY_TYPE_LABELS: Record<PlayType, string> = {
  run: 'Run', pass: 'Pass', sack: 'Sack', penalty: 'Penalty', fieldGoal: 'Field Goal', safety: 'Safety', punt: 'Punt',
}

function PendingScoreDecisionPanel() {
  const { game, setGame } = useGame()
  if (!game.pendingScoreDecision) return null
  const team = game.pendingScoreDecision.teamId === game.teamA.id ? game.teamA : game.teamB

  const decide = (kind: 'kick' | 'twoPoint', good: boolean) => {
    setGame((g) => logExtraPointPlay(g, { kind, good, playerId: null }))
  }

  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <p className="font-display text-3xl tracking-wide text-[var(--color-amber)]">TOUCHDOWN</p>
      <p className="mb-5 text-sm text-[var(--color-text-muted)]">{team.name} — extra point or 2-point try?</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={() => decide('kick', true)}>PAT Good</Button>
        <Button variant="secondary" onClick={() => decide('kick', false)}>PAT No Good</Button>
        <Button variant="primary" onClick={() => decide('twoPoint', true)}>2PT Good</Button>
        <Button variant="secondary" onClick={() => decide('twoPoint', false)}>2PT Failed</Button>
      </div>
    </Card>
  )
}

function PendingKickoffPanel() {
  const { game, setGame } = useGame()
  const [spot, setSpot] = useState(80)
  if (!game.pendingKickoff) return null
  const receiving = game.pendingKickoff.receivingTeamId === game.teamA.id ? game.teamA : game.teamB

  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <p className="font-display text-3xl tracking-wide text-[var(--color-amber)]">
        {game.pendingKickoff.afterSafety ? 'FREE KICK' : 'KICKOFF'}
      </p>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">{receiving.name} receives</p>
      <NumberStepper label="Starting position — yards to go for a TD" value={spot} onChange={setSpot} min={1} max={99} />
      <p className="mb-4 mt-1 text-xs text-[var(--color-text-dim)]">Default 80 = touchback, own 20-yard line.</p>
      <Button variant="primary" size="lg" onClick={() => setGame((g) => logKickoffPlay(g, { distanceToGoal: spot }))}>
        Confirm
      </Button>
    </Card>
  )
}

function RunForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const offense = game.possessionTeamId === game.teamA.id ? game.teamA : game.teamB
  const [carrierId, setCarrierId] = useState<string | null>(null)
  const [yards, setYards] = useState(0)
  const [fumbleLost, setFumbleLost] = useState(false)

  const submit = () => {
    if (!carrierId) return
    setGame((g) => logRunPlay(g, { carrierId, yards, fumbleLost }))
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayerPicker label="Ball carrier" roster={offense.roster} order={orderForRunCarrier} value={carrierId} onChange={setCarrierId} />
      <NumberStepper label="Yards gained (negative for loss)" value={yards} onChange={setYards} min={-25} max={99} />
      <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <input type="checkbox" checked={fumbleLost} onChange={(e) => setFumbleLost(e.target.checked)} />
        Fumble lost (turnover)
      </label>
      <Button variant="primary" size="lg" onClick={submit} disabled={!carrierId}>Log Run</Button>
    </div>
  )
}

function PassForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const offense = game.possessionTeamId === game.teamA.id ? game.teamA : game.teamB
  const defaultQb = game.lineups[offense.id].slots.find((s) => s.group === 'QB')?.playerId ?? null
  const [passerId, setPasserId] = useState<string | null>(defaultQb)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<'complete' | 'incomplete' | 'intercepted'>('complete')
  const [yards, setYards] = useState(0)

  const submit = () => {
    if (!passerId || !targetId) return
    setGame((g) => logPassPlay(g, { passerId, targetId, outcome, yards: outcome === 'complete' ? yards : 0 }))
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayerPicker label="Passer" roster={offense.roster} order={orderForPasser} value={passerId} onChange={setPasserId} />
      <PlayerPicker label="Target (required, even if incomplete)" roster={offense.roster} order={orderForTarget} value={targetId} onChange={setTargetId} />
      <div>
        <Label>Result</Label>
        <div className="flex gap-2">
          {(['complete', 'incomplete', 'intercepted'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                outcome === o ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber-soft)]' : 'border-[var(--color-border-bright)] text-[var(--color-text-muted)]'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      {outcome === 'complete' && <NumberStepper label="Yards gained" value={yards} onChange={setYards} min={-10} max={99} />}
      <Button variant="primary" size="lg" onClick={submit} disabled={!passerId || !targetId}>Log Pass</Button>
    </div>
  )
}

function SackForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const offense = game.possessionTeamId === game.teamA.id ? game.teamA : game.teamB
  const defense = otherTeamId(game, offense.id) === game.teamA.id ? game.teamA : game.teamB
  const passerId = game.lineups[offense.id].slots.find((s) => s.group === 'QB')?.playerId ?? null
  const [defenderId, setDefenderId] = useState<string | null>(null)
  const [yards, setYards] = useState(5)

  const submit = () => {
    if (!passerId || !defenderId) return
    setGame((g) => logSackPlay(g, { passerId, defenderId, yards }))
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {!passerId && <p className="text-sm text-[var(--color-bad)]">No QB is set in the lineup for {offense.name} — set one in Lineup first.</p>}
      <PlayerPicker label="Defender" roster={defense.roster} order={orderForDefender} value={defenderId} onChange={setDefenderId} />
      <NumberStepper label="Yards lost" value={yards} onChange={setYards} min={1} max={25} />
      <Button variant="primary" size="lg" onClick={submit} disabled={!passerId || !defenderId}>Log Sack</Button>
    </div>
  )
}

function PenaltyForm({ onDone }: { onDone: () => void }) {
  const { setGame } = useGame()
  const [penaltyTypeId, setPenaltyTypeId] = useState(PENALTY_TYPES[0].id)
  const type = getPenaltyType(penaltyTypeId) ?? PENALTY_TYPES[0]
  const [side, setSide] = useState<PenaltySide>(type.defaultSide)
  const [yards, setYards] = useState(type.defaultYards)

  const selectType = (id: string) => {
    const t = getPenaltyType(id)
    if (!t) return
    setPenaltyTypeId(id)
    setSide(t.defaultSide)
    setYards(t.defaultYards)
  }

  const submit = () => {
    setGame((g) => logPenaltyPlay(g, { penaltyTypeId, side, yards }))
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label>Penalty</Label>
        <Select value={penaltyTypeId} onChange={(e) => selectType(e.target.value)}>
          {PENALTY_TYPES.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.defaultYards} yds)</option>
          ))}
        </Select>
      </div>
      {!isPenaltySideLocked(type) && (
        <div>
          <Label>Against</Label>
          <div className="flex gap-2">
            {(['offense', 'defense'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                  side === s ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber-soft)]' : 'border-[var(--color-border-bright)] text-[var(--color-text-muted)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <NumberStepper label="Yards" value={yards} onChange={setYards} min={1} max={50} />
      <Button variant="primary" size="lg" onClick={submit}>Log Penalty</Button>
    </div>
  )
}

function FieldGoalForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const offense = game.possessionTeamId === game.teamA.id ? game.teamA : game.teamB
  const [kickerId, setKickerId] = useState<string | null>(null)
  const [made, setMade] = useState(true)
  const [distance, setDistance] = useState(30)

  const submit = () => {
    setGame((g) => logFieldGoalPlay(g, { kickerId, made, distance }))
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayerPicker label="Kicker (optional)" roster={offense.roster} order={(r) => orderByPriority(r, ['K'])} value={kickerId} onChange={setKickerId} />
      <div>
        <Label>Result</Label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMade(true)} className={`flex-1 rounded-md border px-3 py-2 text-sm ${made ? 'border-[var(--color-good)] bg-[var(--color-good)]/15 text-[var(--color-good)]' : 'border-[var(--color-border-bright)] text-[var(--color-text-muted)]'}`}>Made</button>
          <button type="button" onClick={() => setMade(false)} className={`flex-1 rounded-md border px-3 py-2 text-sm ${!made ? 'border-[var(--color-bad)] bg-[var(--color-bad)]/15 text-[var(--color-bad)]' : 'border-[var(--color-border-bright)] text-[var(--color-text-muted)]'}`}>Missed</button>
        </div>
      </div>
      <NumberStepper label="Distance (yds, optional)" value={distance} onChange={setDistance} min={0} max={70} />
      <Button variant="primary" size="lg" onClick={submit}>Log Field Goal</Button>
    </div>
  )
}

function SafetyForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const offense = game.possessionTeamId === game.teamA.id ? game.teamA : game.teamB
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-text-muted)]">Records a safety against {offense.name} (2 points to {otherTeamId(game, offense.id) === game.teamA.id ? game.teamA.name : game.teamB.name}), then sets up their free kick.</p>
      <Button variant="primary" size="lg" onClick={() => { setGame((g) => logSafetyPlay(g)); onDone() }}>Log Safety</Button>
    </div>
  )
}

function PuntForm({ onDone }: { onDone: () => void }) {
  const { game, setGame } = useGame()
  const [spot, setSpot] = useState(() => suggestedPuntSpot(game))
  return (
    <div className="flex flex-col gap-4">
      <NumberStepper label="Opponent's starting position — yards to go for a TD" value={spot} onChange={setSpot} min={1} max={99} />
      <Button variant="primary" size="lg" onClick={() => { setGame((g) => logPuntPlay(g, { receivingDistanceToGoal: spot })); onDone() }}>Log Punt</Button>
    </div>
  )
}

function PlayEntry() {
  const [playType, setPlayType] = useState<PlayType | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(Object.keys(PLAY_TYPE_LABELS) as PlayType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPlayType(t)}
            className={`rounded-md border px-3 py-3 text-sm font-semibold transition-colors ${
              playType === t
                ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber-soft)]'
                : 'border-[var(--color-border-bright)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-amber)]/60'
            }`}
          >
            {PLAY_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {playType && (
        <Card className="p-4">
          {playType === 'run' && <RunForm onDone={() => setPlayType(null)} />}
          {playType === 'pass' && <PassForm onDone={() => setPlayType(null)} />}
          {playType === 'sack' && <SackForm onDone={() => setPlayType(null)} />}
          {playType === 'penalty' && <PenaltyForm onDone={() => setPlayType(null)} />}
          {playType === 'fieldGoal' && <FieldGoalForm onDone={() => setPlayType(null)} />}
          {playType === 'safety' && <SafetyForm onDone={() => setPlayType(null)} />}
          {playType === 'punt' && <PuntForm onDone={() => setPlayType(null)} />}
        </Card>
      )}
    </div>
  )
}

function RecentPlays() {
  const { game, setGame } = useGame()
  const recent = [...game.plays].slice(-8).reverse()

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-xl tracking-wide text-[var(--color-text-muted)]">Recent Plays</h3>
        <Button size="sm" variant="ghost" disabled={game.plays.length === 0} onClick={() => setGame((g) => undoLastPlay(g))}>
          ↺ Undo last play
        </Button>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-[var(--color-text-dim)]">No plays logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 font-mono text-sm">
          {recent.map((p) => (
            <li key={p.id} className="text-[var(--color-text)]">{describePlay(game, p)}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default function LiveGamePage() {
  const { game, setGame } = useGame()
  const navigate = useNavigate()
  const { gameId } = useParams()
  const [tab, setTab] = useState<'enter' | 'leaders'>('enter')
  const blocked = Boolean(game.pendingScoreDecision || game.pendingKickoff)

  const endGame = () => {
    setGame((g) => ({ ...g, status: 'final' }))
    navigate(`/game/${gameId}/box`)
  }

  return (
    <div>
      <MilestoneToasts />
      <Scoreboard game={game} />

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant={tab === 'enter' ? 'primary' : 'secondary'} onClick={() => setTab('enter')}>Enter Play</Button>
            <Button size="sm" variant={tab === 'leaders' ? 'primary' : 'secondary'} onClick={() => setTab('leaders')}>Stat Leaders</Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/game/${gameId}/lineup`)}>Lineup / Subs</Button>
            <Button size="sm" variant="ghost" onClick={endGame}>End Game</Button>
          </div>
        </div>

        {blocked ? (
          <>{game.pendingScoreDecision ? <PendingScoreDecisionPanel /> : <PendingKickoffPanel />}</>
        ) : tab === 'enter' ? (
          <div className="flex flex-col gap-4">
            <PlayEntry />
            <RecentPlays />
          </div>
        ) : (
          <LeadersPanel game={game} />
        )}
      </div>
    </div>
  )
}
