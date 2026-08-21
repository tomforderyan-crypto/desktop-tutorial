import type { TeamInfo } from '../../types'
import { useStudio } from '../../state/StudioContext'
import { Button, Card, Label, NumberStepper, Select, TextInput, Toggle } from '../../components/ui'

function TeamEditor({ label, team, onChange }: { label: string; team: TeamInfo; onChange: (patch: Partial<TeamInfo>) => void }) {
  return (
    <Card className="p-4">
      <div className="mb-3 font-display text-lg font-semibold text-[var(--color-text)]">{label}</div>
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <TextInput value={team.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Abbreviation</Label>
            <TextInput value={team.abbreviation} maxLength={4} onChange={(e) => onChange({ abbreviation: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <Label>Color</Label>
            <input
              type="color"
              value={team.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-[42px] w-full rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] p-1"
            />
          </div>
        </div>
        <div>
          <Label>Logo URL</Label>
          <TextInput placeholder="https://…" value={team.logoUrl} onChange={(e) => onChange({ logoUrl: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper label="Score" value={team.score} min={0} onChange={(v) => onChange({ score: v })} />
          <NumberStepper label="Timeouts" value={team.timeouts} min={0} max={3} onChange={(v) => onChange({ timeouts: v })} />
        </div>
      </div>
    </Card>
  )
}

export default function ScoreboardTab() {
  const { state, patch } = useStudio()
  const sb = state.scoreboard

  return (
    <div className="space-y-4">
      <Toggle checked={sb.visible} onChange={(v) => patch('scoreboard', { visible: v })} label="Show scoreboard on overlay" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamEditor label="Away" team={sb.away} onChange={(p) => patch('scoreboard', { away: { ...sb.away, ...p } })} />
        <TeamEditor label="Home" team={sb.home} onChange={(p) => patch('scoreboard', { home: { ...sb.home, ...p } })} />
      </div>
      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <div>
          <Label>Period</Label>
          <Select value={sb.period} onChange={(e) => patch('scoreboard', { period: e.target.value })}>
            {['Q1', 'Q2', 'Q3', 'Q4', 'OT'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Clock</Label>
          <TextInput value={sb.clock} placeholder="12:00" onChange={(e) => patch('scoreboard', { clock: e.target.value })} />
        </div>
        <div>
          <Label>Possession</Label>
          <Select
            value={sb.possession ?? ''}
            onChange={(e) => patch('scoreboard', { possession: (e.target.value || null) as 'home' | 'away' | null })}
          >
            <option value="">None</option>
            <option value="away">Away</option>
            <option value="home">Home</option>
          </Select>
        </div>
        <div>
          <Label>Down &amp; Distance</Label>
          <TextInput placeholder="3rd & 7" value={sb.downDistance} onChange={(e) => patch('scoreboard', { downDistance: e.target.value })} />
        </div>
      </Card>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          patch('scoreboard', { home: { ...sb.home, score: 0 }, away: { ...sb.away, score: 0 }, period: 'Q1', clock: '12:00' })
        }
      >
        Reset scores &amp; clock
      </Button>
    </div>
  )
}
