import { useMemo, useState } from 'react'
import { listGames } from '../storage/gameRepository'
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, type FirebaseOverlayConfig } from '../lib/firebaseConfig'
import { testFirebaseConnection } from '../lib/overlaySync'
import { Button, Card, Label, Select, TextInput } from '../components/ui'

const EMPTY_CONFIG: FirebaseOverlayConfig = { apiKey: '', authDomain: '', databaseURL: '', projectId: '', appId: '' }

const FIELDS: { key: keyof FirebaseOverlayConfig; label: string; placeholder: string }[] = [
  { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy…' },
  { key: 'authDomain', label: 'Auth Domain', placeholder: 'your-project.firebaseapp.com' },
  { key: 'databaseURL', label: 'Database URL', placeholder: 'https://your-project-default-rtdb.firebaseio.com' },
  { key: 'projectId', label: 'Project ID', placeholder: 'your-project' },
  { key: 'appId', label: 'App ID', placeholder: '1:1234567890:web:abcdef' },
]

function overlayUrlFor(gameId: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/overlay/${gameId}`
}

function ConfigForm() {
  const [config, setConfig] = useState<FirebaseOverlayConfig>(() => getFirebaseConfig() ?? EMPTY_CONFIG)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const saved = getFirebaseConfig()
  const complete = FIELDS.every((f) => config[f.key].trim().length > 0)

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testFirebaseConnection(config)
    setTestResult(result.ok ? { ok: true, message: 'Connected — Firebase accepted a test write.' } : { ok: false, message: result.message })
    setTesting(false)
  }

  const save = () => {
    saveFirebaseConfig(config)
    setTestResult(null)
  }

  const clear = () => {
    clearFirebaseConfig()
    setConfig(EMPTY_CONFIG)
    setTestResult(null)
  }

  return (
    <Card className="p-4">
      <h2 className="mb-1 font-display text-2xl tracking-wide text-[var(--color-text)]">Firebase Connection</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Stored only in this browser. The tracker writes live game state here; the overlay page (loaded wherever OBS
        or your capture tool runs) reads it back.
      </p>
      <div className="flex flex-col gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <TextInput
              value={config[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" disabled={!complete} onClick={save}>Save</Button>
        <Button variant="secondary" disabled={!complete || testing} onClick={() => void test()}>
          {testing ? 'Testing…' : 'Test Connection'}
        </Button>
        {saved && <Button variant="danger" onClick={clear}>Clear Saved Config</Button>}
      </div>
      {testResult && (
        <p className={`mt-3 text-sm ${testResult.ok ? 'text-[var(--color-good)]' : 'text-[var(--color-bad)]'}`}>
          {testResult.message}
        </p>
      )}
    </Card>
  )
}

function OverlayLinkCard() {
  const games = useMemo(() => listGames(), [])
  const [gameId, setGameId] = useState(games[0]?.id ?? '')
  const [copied, setCopied] = useState(false)
  const url = gameId ? overlayUrlFor(gameId) : ''

  const copy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="p-4">
      <h2 className="mb-1 font-display text-2xl tracking-wide text-[var(--color-text)]">Overlay URL</h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        Point an OBS Browser Source at this URL — it's a transparent page showing just the live scorebug for the
        selected game.
      </p>
      {games.length === 0 ? (
        <p className="text-sm text-[var(--color-text-dim)]">No games yet — start one first.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <Label>Game</Label>
            <Select value={gameId} onChange={(e) => setGameId(e.target.value)}>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.teamAName} vs {g.teamBName} — {g.scoreA}–{g.scoreB} ({g.status})
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <TextInput readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <Button variant="secondary" onClick={() => void copy()}>{copied ? 'Copied!' : 'Copy'}</Button>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-amber-soft)] hover:underline">
            Open in a new tab to preview →
          </a>
        </div>
      )}
    </Card>
  )
}

function InstructionsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-[var(--color-text)]">Setup</h2>
      <div className="flex flex-col gap-4 text-sm text-[var(--color-text-muted)]">
        <div>
          <p className="mb-1 font-semibold text-[var(--color-text)]">1. Create a free Firebase Realtime Database</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>At <span className="font-mono text-[var(--color-text)]">console.firebase.google.com</span>, create a project (any name).</li>
            <li>In the project, open <span className="font-mono">Build → Realtime Database</span> and create a database.</li>
            <li>Open <span className="font-mono">Project settings → General</span>, scroll to "Your apps," add a Web app, and copy the five config values above.</li>
          </ol>
        </div>
        <div>
          <p className="mb-1 font-semibold text-[var(--color-text)]">2. Set database rules</p>
          <p className="mb-1">
            This is a scoreboard, not sensitive data — open read/write under the <span className="font-mono">overlays</span> path
            keeps setup simple. In <span className="font-mono">Realtime Database → Rules</span>:
          </p>
          <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-xs text-[var(--color-text)]">
{`{
  "rules": {
    "overlays": {
      ".read": true,
      ".write": true
    }
  }
}`}
          </pre>
        </div>
        <div>
          <p className="mb-1 font-semibold text-[var(--color-text)]">3. Add the overlay in OBS</p>
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Sources → + → Browser Source.</li>
            <li>Paste the Overlay URL from above.</li>
            <li>Set Width/Height to your canvas size (e.g. 1920×1080).</li>
            <li>Leave "Shutdown source when not visible" unchecked so it keeps syncing in the background.</li>
            <li>The page background is transparent — no chroma key needed.</li>
          </ol>
        </div>
      </div>
    </Card>
  )
}

export default function OverlaySettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-[var(--color-text)]">Overlay Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Connect a broadcast overlay graphic that mirrors the live scoreboard into OBS or another capture tool.
        </p>
      </div>
      <ConfigForm />
      <OverlayLinkCard />
      <InstructionsCard />
    </div>
  )
}
