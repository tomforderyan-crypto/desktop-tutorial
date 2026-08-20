import { useId, useMemo, useState } from 'react'
import type { Player } from '../types'
import { Label, TextInput } from './ui'

function matches(player: Player, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return player.name.toLowerCase().includes(q) || player.number.toLowerCase().includes(q)
}

export function PlayerPicker({
  label,
  roster,
  order,
  value,
  onChange,
}: {
  label: string
  roster: Player[]
  order: (roster: Player[]) => Player[]
  value: string | null
  onChange: (playerId: string) => void
}) {
  const [query, setQuery] = useState('')
  const ordered = useMemo(() => order(roster), [roster, order])
  const filtered = useMemo(() => ordered.filter((p) => matches(p, query)), [ordered, query])
  const inputId = useId()

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <TextInput
        id={inputId}
        aria-label={label}
        placeholder="Search # or name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-2"
      />
      <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-[var(--color-border)] p-2">
        {filtered.length === 0 && <p className="p-2 text-sm text-[var(--color-text-dim)]">No players match.</p>}
        {filtered.map((p) => {
          const selected = p.id === value
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(p.id)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-sm transition-colors ${
                selected
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber-soft)]'
                  : 'border-[var(--color-border-bright)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-amber)]/60'
              }`}
            >
              <span className="font-mono font-semibold">#{p.number}</span> <span>{p.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
