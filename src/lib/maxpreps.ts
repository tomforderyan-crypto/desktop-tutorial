import type { RosterPosition } from '../types'

export interface ImportedPlayer {
  number: string
  name: string
  position: RosterPosition
  rawPosition: string
}

export class MaxPrepsImportError extends Error {}

const POSITION_MAP: Record<string, RosterPosition> = {
  QB: 'QB', RB: 'RB', HB: 'RB', TB: 'RB', FB: 'FB', WR: 'WR', SE: 'WR', FL: 'WR', TE: 'TE',
  OL: 'OL', OT: 'OT', T: 'OT', LT: 'OT', RT: 'OT', OG: 'OG', G: 'OG', LG: 'OG', RG: 'OG', C: 'C',
  DL: 'DL', DE: 'DE', DT: 'DT', NG: 'NG', NT: 'NG', LB: 'LB', ILB: 'LB', OLB: 'LB', MLB: 'LB',
  CB: 'CB', S: 'S', SS: 'S', FS: 'S', DB: 'DB', K: 'K', PK: 'K', P: 'P', ATH: 'ATH',
}

/** Roster pages often list multiple positions for one player (e.g. "TE, WR"
 * or "OLB, RB") — take the first as primary rather than failing to match at
 * all on the combined string. */
export function normalizePosition(raw: string): RosterPosition {
  const primary = raw.split(',')[0] ?? raw
  const clean = primary.trim().toUpperCase().replace(/[^A-Z]/g, '')
  return POSITION_MAP[clean] ?? 'OTHER'
}

/** Best-effort MaxPreps roster fetch. MaxPreps has no public API, and most
 * roster pages are client-rendered and/or blocked from cross-origin fetch by
 * the browser (no CORS headers on their end) — this will fail for a lot of
 * real URLs. That's expected; the manual "add player" flow is the reliable
 * path and always available regardless of what happens here. */
export async function fetchMaxPrepsRosterHtml(url: string): Promise<string> {
  let res: Response
  try {
    res = await fetch(url, { mode: 'cors' })
  } catch {
    throw new MaxPrepsImportError(
      'Could not reach that URL from the browser (likely blocked by cross-origin restrictions). Try "Paste page source" instead, or add players manually.',
    )
  }
  if (!res.ok) {
    throw new MaxPrepsImportError(`MaxPreps responded with an error (${res.status}). Try "Paste page source" or add players manually.`)
  }
  return res.text()
}

/** Parse a MaxPreps roster page (or its pasted HTML source) for
 * number/name/position rows. Table-based layouts are handled by matching a
 * header row (#, NAME, POS) and reading the columns beneath it; anything
 * else falls through to an empty result so the caller can fall back to
 * manual entry. */
export function parseRosterHtml(html: string): { players: ImportedPlayer[]; warning?: string } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const players: ImportedPlayer[] = []

  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const rows = Array.from(table.querySelectorAll('tr'))
    if (rows.length < 2) continue

    const headerCells = Array.from(rows[0].querySelectorAll('th,td')).map((c) => (c.textContent ?? '').trim().toUpperCase())
    const numberCol = headerCells.findIndex((c) => c === '#' || c === 'NO' || c === 'NO.' || c === 'NUM')
    const nameCol = headerCells.findIndex((c) => c.includes('NAME') || c === 'PLAYER')
    const posCol = headerCells.findIndex((c) => c === 'POS' || c === 'POS.' || c.includes('POSITION'))
    if (numberCol === -1 || nameCol === -1 || posCol === -1) continue

    for (const row of rows.slice(1)) {
      const cells = Array.from(row.querySelectorAll('td')).map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
      if (cells.length <= Math.max(numberCol, nameCol, posCol)) continue
      const number = cells[numberCol].replace(/[^0-9]/g, '')
      const name = cells[nameCol]
      const rawPosition = cells[posCol]
      if (!name || !rawPosition) continue
      players.push({ number: number || '—', name, position: normalizePosition(rawPosition), rawPosition })
    }

    if (players.length > 0) break
  }

  if (players.length === 0) {
    return {
      players: [],
      warning:
        'No roster table could be found on that page. MaxPreps roster pages are often rendered client-side, which a plain page fetch can\'t see — add the roster manually below instead.',
    }
  }

  return { players }
}

export async function importMaxPrepsRosterFromUrl(url: string): Promise<{ players: ImportedPlayer[]; warning?: string }> {
  const html = await fetchMaxPrepsRosterHtml(url)
  return parseRosterHtml(html)
}
