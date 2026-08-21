import { useState } from 'react'
import type { Player, Team } from '../types'
import { useGame } from '../context/GameContext'
import { useBroadcastConnection, setOverlaySelection } from '../lib/broadcastClient'
import { Button, Card, Label, TextInput } from '../components/ui'

const OVERLAY_URL = `${window.location.origin}${import.meta.env.BASE_URL}#/overlay`

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const swatch = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
  return (
    <div className="flex-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-[42px] w-12 shrink-0 cursor-pointer rounded-md border border-[var(--color-border-bright)] bg-transparent p-0.5"
        />
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="flex-1 font-mono uppercase"
        />
      </div>
    </div>
  )
}

function TeamColorCard({ team, onChange }: { team: Team; onChange: (field: 'primaryColor' | 'secondaryColor', value: string) => void }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-2xl tracking-wide">{team.name || 'Unnamed team'}</h3>
      <div className="flex gap-3">
        <ColorField label="Primary" value={team.primaryColor} onChange={(v) => onChange('primaryColor', v)} />
        <ColorField label="Secondary" value={team.secondaryColor} onChange={(v) => onChange('secondaryColor', v)} />
      </div>
    </Card>
  )
}

function RosterList({
  team,
  activePlayerId,
  onSelect,
}: {
  team: Team
  activePlayerId: string | null
  onSelect: (player: Player) => void
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-2xl tracking-wide">{team.name || 'Unnamed team'}</h3>
      {team.roster.length === 0 ? (
        <p className="text-sm text-[var(--color-text-dim)]">No roster.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {team.roster.map((player) => {
            const isLive = player.id === activePlayerId
            return (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => onSelect(player)}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                    isLive
                      ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15'
                      : 'border-[var(--color-border-bright)] bg-[var(--color-surface-alt)] hover:border-[var(--color-amber)]/60'
                  }`}
                >
                  <span className="w-9 shrink-0 font-mono font-semibold text-[var(--color-amber-soft)]">#{player.number}</span>
                  <span className="flex-1 text-sm text-[var(--color-text)]">{player.name}</span>
                  <span className="text-xs text-[var(--color-text-dim)]">{player.position}</span>
                  {isLive && (
                    <span className="rounded bg-[var(--color-bad)] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                      LIVE
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default function ControlPanelPage() {
  const { game, setGame } = useGame()
  const { overlay, connected } = useBroadcastConnection()
  const [copied, setCopied] = useState(false)

  const updateTeamColor = (teamId: string, field: 'primaryColor' | 'secondaryColor', value: string) => {
    setGame((g) => {
      const isA = g.teamA.id === teamId
      const team = isA ? g.teamA : g.teamB
      const updated = { ...team, [field]: value }
      return isA ? { ...g, teamA: updated } : { ...g, teamB: updated }
    })
  }

  const selectPlayer = (player: Player) => {
    setOverlaySelection(player.id === overlay.playerId ? null : player.id)
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(OVERLAY_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable — the URL is still shown and selectable.
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Control Panel</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-[var(--color-good)]' : 'bg-[var(--color-bad)]'}`} />
            {connected ? 'Overlay bridge connected' : 'Overlay bridge not running — start it with npm run overlay-server'}
          </p>
        </div>
        <Button variant="danger" disabled={!overlay.playerId} onClick={() => setOverlaySelection(null)}>
          Dismiss Card
        </Button>
      </div>

      <Card className="mb-5 p-4">
        <Label>Overlay URL — paste into an OBS/vMix Browser Source</Label>
        <div className="flex gap-2">
          <TextInput readOnly value={OVERLAY_URL} className="flex-1 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button type="button" onClick={copyUrl}>{copied ? 'Copied!' : 'Copy'}</Button>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamColorCard team={game.teamA} onChange={(field, v) => updateTeamColor(game.teamA.id, field, v)} />
        <TeamColorCard team={game.teamB} onChange={(field, v) => updateTeamColor(game.teamB.id, field, v)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RosterList team={game.teamA} activePlayerId={overlay.playerId} onSelect={selectPlayer} />
        <RosterList team={game.teamB} activePlayerId={overlay.playerId} onSelect={selectPlayer} />
      </div>
    </div>
  )
}
