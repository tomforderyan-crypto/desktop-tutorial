import type { RosterPosition } from '../types'
import { normalizePosition, type ImportedPlayer } from './maxpreps'

export async function recognizeRosterPhoto(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const Tesseract = await import('tesseract.js')
  const result = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100))
    },
  })
  return result.data.text
}

const POSITION_TOKEN = /^[A-Z]{1,3}$/

/** Best-effort line parser for a photographed roster sheet. Handles the
 * common "# Name Pos" layout (number leading or trailing) per line; extra
 * columns (grade, height, weight) are ignored. Photographed/printed text
 * OCRs noisily, so this is intentionally permissive — the caller always
 * shows results for review/edit before anything is added to the roster. */
export function parseRosterOcrText(text: string): ImportedPlayer[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const players: ImportedPlayer[] = []

  for (const line of lines) {
    const cleaned = line.replace(/[^A-Za-z0-9 ,.'-]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleaned) continue

    const tokens = cleaned.split(' ')
    if (tokens.length < 2) continue

    let number: string | null = null
    let rest = tokens
    if (/^\d{1,2}$/.test(tokens[0])) {
      number = tokens[0]
      rest = tokens.slice(1)
    } else if (/^\d{1,2}$/.test(tokens[tokens.length - 1])) {
      number = tokens[tokens.length - 1]
      rest = tokens.slice(0, -1)
    }
    if (!number || rest.length === 0) continue

    let position: RosterPosition = 'OTHER'
    let rawPosition = ''
    const last = rest[rest.length - 1]
    if (POSITION_TOKEN.test(last) && normalizePosition(last) !== 'OTHER') {
      rawPosition = last
      position = normalizePosition(last)
      rest = rest.slice(0, -1)
    }

    const name = rest.join(' ').replace(/,$/, '').trim()
    if (name.length < 2) continue

    players.push({ number, name, position, rawPosition })
  }

  return players
}
