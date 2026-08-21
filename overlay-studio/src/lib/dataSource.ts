import type { RosterRow, TickerItem } from '../types'
import { parseCsv } from './csv'

export function parseJsonRoster(text: string): RosterRow[] {
  if (!text.trim()) return []
  const parsed: unknown = JSON.parse(text)
  const list = Array.isArray(parsed) ? parsed : (parsed as { players?: unknown; rows?: unknown }).players ?? (parsed as { rows?: unknown }).rows
  if (!Array.isArray(list)) {
    throw new Error('Expected a JSON array of player/stat objects (or {"players": [...]}).')
  }
  return list.map((item) => {
    if (typeof item !== 'object' || item === null) throw new Error('Every entry must be an object of field: value pairs.')
    const record: RosterRow = {}
    for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
      record[key] = value == null ? '' : String(value)
    }
    return record
  })
}

/** Converts a normal Google Sheets URL into its "publish to web" CSV export form, if possible. */
export function normalizeSheetUrl(url: string): string {
  const trimmed = url.trim()
  const match = trimmed.match(/\/spreadsheets\/d\/e\/([^/]+)\/pub/)
  if (match) {
    return trimmed.includes('output=csv') ? trimmed : `${trimmed}${trimmed.includes('?') ? '&' : '?'}output=csv`
  }
  return trimmed
}

export async function fetchSheetCsv(url: string): Promise<RosterRow[]> {
  const target = normalizeSheetUrl(url)
  const res = await fetch(target)
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`)
  const text = await res.text()
  return parseCsv(text)
}

/** Fills a `{field}` template (e.g. "{name} — {carries} CAR") once per roster row. */
export function buildTickerItemsFromData(rows: RosterRow[], template: string): TickerItem[] {
  if (!template.trim()) return []
  return rows.map((row, i) => ({
    id: `data-${i}`,
    text: template.replace(/\{(\w+)\}/g, (_, key: string) => row[key] ?? ''),
  }))
}
