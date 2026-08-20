import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player, RosterPosition, Team } from '../types'
import { Button, Card, Label, Select, TextInput } from '../components/ui'
import { createGame, createPlayer, createTeam } from '../state/newGame'
import { saveGame } from '../storage/gameRepository'
import { importMaxPrepsRosterFromUrl, parseRosterHtml, MaxPrepsImportError } from '../lib/maxpreps'

const POSITIONS: RosterPosition[] = [
  'QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C',
  'DL', 'DE', 'DT', 'NG', 'LB', 'CB', 'S', 'DB', 'K', 'P', 'ATH', 'OTHER',
]

function RosterEditor({ team, onChange }: { team: Team; onChange: (team: Team) => void }) {
  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<{ tone: 'error' | 'warning' | 'success'; text: string } | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedHtml, setPastedHtml] = useState('')

  const [manualNumber, setManualNumber] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualPosition, setManualPosition] = useState<RosterPosition>('WR')

  const addPlayers = (players: Player[]) => {
    onChange({ ...team, roster: [...team.roster, ...players] })
  }

  const runImport = async () => {
    setImporting(true)
    setImportMsg(null)
    try {
      const { players, warning } = await importMaxPrepsRosterFromUrl(url)
      if (players.length === 0) {
        setImportMsg({ tone: 'warning', text: warning ?? 'No players found — add the roster manually below.' })
      } else {
        addPlayers(players.map((p) => createPlayer(p)))
        setImportMsg({ tone: 'success', text: `Imported ${players.length} player${players.length === 1 ? '' : 's'}. Review below and add anyone missing.` })
      }
    } catch (err) {
      const text = err instanceof MaxPrepsImportError ? err.message : 'Import failed unexpectedly — add the roster manually below.'
      setImportMsg({ tone: 'error', text })
    } finally {
      setImporting(false)
    }
  }

  const runPasteParse = () => {
    setImportMsg(null)
    const { players, warning } = parseRosterHtml(pastedHtml)
    if (players.length === 0) {
      setImportMsg({ tone: 'warning', text: warning ?? 'No players found in that source — add the roster manually below.' })
    } else {
      addPlayers(players.map((p) => createPlayer(p)))
      setImportMsg({ tone: 'success', text: `Imported ${players.length} player${players.length === 1 ? '' : 's'} from pasted source.` })
      setPastedHtml('')
    }
  }

  const addManual = () => {
    if (!manualName.trim() || !manualNumber.trim()) return
    addPlayers([createPlayer({ number: manualNumber.trim(), name: manualName.trim(), position: manualPosition })])
    setManualNumber('')
    setManualName('')
  }

  const removePlayer = (id: string) => onChange({ ...team, roster: team.roster.filter((p) => p.id !== id) })

  return (
    <Card className="p-4">
      <Label>Team Name</Label>
      <TextInput
        value={team.name}
        onChange={(e) => onChange({ ...team, name: e.target.value })}
        placeholder="e.g. Central High Cougars"
        className="mb-4"
      />

      <Label>Import roster from MaxPreps</Label>
      <div className="mb-2 flex gap-2">
        <TextInput
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.maxpreps.com/.../roster/"
          className="flex-1"
        />
        <Button type="button" onClick={runImport} disabled={!url || importing}>
          {importing ? 'Importing…' : 'Import'}
        </Button>
      </div>
      <button
        type="button"
        className="mb-3 text-xs text-[var(--color-text-muted)] underline decoration-dotted hover:text-[var(--color-amber-soft)]"
        onClick={() => setPasteMode((v) => !v)}
      >
        {pasteMode ? 'Hide' : 'URL import blocked?'} Paste page source instead
      </button>
      {pasteMode && (
        <div className="mb-3">
          <textarea
            value={pastedHtml}
            onChange={(e) => setPastedHtml(e.target.value)}
            placeholder="View source on the roster page (Ctrl/Cmd+U), copy all, paste here"
            rows={4}
            className="mb-2 w-full rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-3 py-2 font-mono text-xs text-[var(--color-text)] focus:border-[var(--color-amber)] focus:outline-none"
          />
          <Button type="button" size="sm" onClick={runPasteParse} disabled={!pastedHtml.trim()}>
            Parse pasted source
          </Button>
        </div>
      )}
      {importMsg && (
        <p
          className={`mb-3 rounded-md px-3 py-2 text-sm ${
            importMsg.tone === 'error'
              ? 'bg-[var(--color-bad)]/10 text-[var(--color-bad)]'
              : importMsg.tone === 'warning'
                ? 'bg-[var(--color-flag)]/10 text-[var(--color-flag)]'
                : 'bg-[var(--color-good)]/10 text-[var(--color-good)]'
          }`}
        >
          {importMsg.text}
        </p>
      )}

      <Label>Add player manually</Label>
      <div className="mb-4 flex flex-wrap gap-2">
        <TextInput
          value={manualNumber}
          onChange={(e) => setManualNumber(e.target.value)}
          placeholder="#"
          className="w-16"
        />
        <TextInput
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="Player name"
          className="min-w-[10rem] flex-1"
        />
        <Select value={manualPosition} onChange={(e) => setManualPosition(e.target.value as RosterPosition)} className="w-24">
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={addManual} disabled={!manualName.trim() || !manualNumber.trim()}>
          Add
        </Button>
      </div>

      <Label>Roster ({team.roster.length})</Label>
      <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--color-border)]">
        {team.roster.length === 0 ? (
          <p className="p-3 text-sm text-[var(--color-text-dim)]">No players yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {team.roster.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  <span className="mr-2 font-mono font-semibold text-[var(--color-amber-soft)]">#{p.number}</span>
                  {p.name} <span className="text-[var(--color-text-dim)]">· {p.position}</span>
                </span>
                <button onClick={() => removePlayer(p.id)} className="text-[var(--color-text-dim)] hover:text-[var(--color-bad)]" aria-label="Remove player">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

export default function NewGamePage() {
  const navigate = useNavigate()
  const [teamA, setTeamA] = useState<Team>(() => createTeam(''))
  const [teamB, setTeamB] = useState<Team>(() => createTeam(''))

  const canContinue = teamA.name.trim() && teamB.name.trim() && teamA.roster.length > 0 && teamB.roster.length > 0

  const continueToLineup = () => {
    const game = createGame(teamA, teamB)
    game.status = 'lineup'
    saveGame(game)
    navigate(`/game/${game.id}/lineup`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 font-display text-4xl tracking-wide">New Game</h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Enter both teams and their rosters. Import from MaxPreps is best-effort — add players manually if it doesn't parse.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RosterEditor team={teamA} onChange={setTeamA} />
        <RosterEditor team={teamB} onChange={setTeamB} />
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="lg" onClick={continueToLineup} disabled={!canContinue}>
          Continue to Lineup →
        </Button>
      </div>
    </div>
  )
}
