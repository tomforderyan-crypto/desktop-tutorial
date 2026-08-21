import { useRef, useState } from 'react'
import type { Player, RosterPosition } from '../types'
import { createPlayer } from '../state/newGame'
import { recognizeRosterPhoto, parseRosterOcrText } from '../lib/rosterOcr'
import { Button, Select, TextInput } from './ui'
import { makeId } from '../lib/id'

const POSITIONS: RosterPosition[] = [
  'QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C',
  'DL', 'DE', 'DT', 'NG', 'LB', 'CB', 'S', 'DB', 'K', 'P', 'ATH', 'OTHER',
]

interface Candidate {
  rowId: string
  include: boolean
  number: string
  name: string
  position: RosterPosition
}

type Status = 'idle' | 'recognizing' | 'review'

export function RosterPhotoImport({ onImport }: { onImport: (players: Player[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setError(null)
    setStatus('recognizing')
    setProgress(0)
    try {
      const text = await recognizeRosterPhoto(file, setProgress)
      const parsed = parseRosterOcrText(text)
      setCandidates(parsed.map((p) => ({ rowId: makeId('row'), include: true, number: p.number, name: p.name, position: p.position })))
      setStatus('review')
    } catch {
      setError('Could not read that photo — try a clearer, well-lit shot, or add players manually below.')
      setStatus('idle')
    }
  }

  const updateRow = (rowId: string, patch: Partial<Candidate>) => {
    setCandidates((rows) => rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  const removeRow = (rowId: string) => setCandidates((rows) => rows.filter((r) => r.rowId !== rowId))

  const confirm = () => {
    const included = candidates.filter((r) => r.include && r.number.trim() && r.name.trim())
    onImport(included.map((r) => createPlayer({ number: r.number.trim(), name: r.name.trim(), position: r.position })))
    setStatus('idle')
    setCandidates([])
  }

  const cancel = () => {
    setStatus('idle')
    setCandidates([])
    setError(null)
  }

  const includedCount = candidates.filter((r) => r.include).length

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onFile(file)
        }}
      />

      {status === 'idle' && (
        <div>
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
            📷 Photo of roster
          </Button>
          <p className="mt-1 text-xs text-[var(--color-text-dim)]">
            Reads # / name / position off a clear, well-lit photo — needs an internet connection the first time to load the
            text recognizer. Always double-check the results below.
          </p>
        </div>
      )}

      {status === 'recognizing' && (
        <div className="rounded-md border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
          Reading photo… {progress}%
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            <div className="h-full bg-[var(--color-amber)] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'review' && (
        <div className="rounded-md border border-[var(--color-border)] p-3">
          {candidates.length === 0 ? (
            <p className="text-sm text-[var(--color-flag)]">
              Couldn't make out any players in that photo — try a clearer, closer, well-lit shot, or add players manually below.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                Found {candidates.length} possible player{candidates.length === 1 ? '' : 's'}. Check the numbers/names/positions
                below (OCR isn't perfect) and uncheck anything wrong, then add.
              </p>
              <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                {candidates.map((row) => (
                  <div key={row.rowId} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) => updateRow(row.rowId, { include: e.target.checked })}
                    />
                    <TextInput
                      value={row.number}
                      onChange={(e) => updateRow(row.rowId, { number: e.target.value })}
                      className="w-14 !py-1.5 text-sm"
                    />
                    <TextInput
                      value={row.name}
                      onChange={(e) => updateRow(row.rowId, { name: e.target.value })}
                      className="min-w-0 flex-1 !py-1.5 text-sm"
                    />
                    <Select
                      value={row.position}
                      onChange={(e) => updateRow(row.rowId, { position: e.target.value as RosterPosition })}
                      className="w-20 !py-1.5 text-sm"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeRow(row.rowId)}
                      className="text-[var(--color-text-dim)] hover:text-[var(--color-bad)]"
                      aria-label="Discard row"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            {candidates.length > 0 && (
              <Button type="button" size="sm" variant="primary" onClick={confirm} disabled={includedCount === 0}>
                Add {includedCount} player{includedCount === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-2 rounded-md bg-[var(--color-bad)]/10 px-3 py-2 text-sm text-[var(--color-bad)]">{error}</p>}
    </div>
  )
}
