import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dataFile = path.join(dataDir, 'youtube-tokens.json')

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify({ account: null }, null, 2))

function read() {
  return JSON.parse(readFileSync(dataFile, 'utf-8'))
}

function write(data) {
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

// Single-user app: one connected YouTube account at a time.
export function getYoutubeAccount() {
  return read().account
}

export function setYoutubeAccount(account) {
  write({ account })
}

export function clearYoutubeAccount() {
  write({ account: null })
}
