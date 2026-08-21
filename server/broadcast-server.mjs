// Local bridge between the Fieldside stat tracker and the OBS/vMix overlay.
//
// The tracker (running in the operator's normal browser tab) POSTs its full
// broadcast state here every time a play is logged; the Control Panel POSTs
// which player (if any) should be showing. Both are persisted to disk
// (stats.json / overlay-state.json) and pushed live to every connected
// WebSocket client — the transparent Overlay page in particular, so a click
// in the Control Panel appears on air with no polling delay.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { WebSocketServer } from 'ws'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const STATE_FILE = join(DATA_DIR, 'stats.json')
const OVERLAY_FILE = join(DATA_DIR, 'overlay-state.json')
const PORT = Number(process.env.BROADCAST_PORT) || 8787

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2))
}

let state = readJson(STATE_FILE, null)
let overlay = readJson(OVERLAY_FILE, { playerId: null })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 2_000_000) {
        reject(new Error('payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function broadcast(message) {
  const data = JSON.stringify(message)
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(data)
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  try {
    if (req.method === 'GET' && req.url === '/api/state') {
      return send(res, 200, state)
    }
    if (req.method === 'GET' && req.url === '/api/overlay') {
      return send(res, 200, overlay)
    }
    if (req.method === 'POST' && req.url === '/api/state') {
      state = JSON.parse(await readBody(req))
      writeJson(STATE_FILE, state)
      broadcast({ type: 'state', payload: state })
      return send(res, 200, { ok: true })
    }
    if (req.method === 'POST' && req.url === '/api/overlay') {
      const body = JSON.parse(await readBody(req))
      overlay = { playerId: body.playerId ?? null }
      writeJson(OVERLAY_FILE, overlay)
      broadcast({ type: 'overlay', payload: overlay })
      return send(res, 200, { ok: true })
    }
    send(res, 404, { error: 'not found' })
  } catch (err) {
    send(res, 400, { error: String(err instanceof Error ? err.message : err) })
  }
})

const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  if (state) ws.send(JSON.stringify({ type: 'state', payload: state }))
  ws.send(JSON.stringify({ type: 'overlay', payload: overlay }))
})

server.listen(PORT, () => {
  console.log(`Fieldside overlay bridge running on http://localhost:${PORT}`)
  console.log(`  stats.json written to ${STATE_FILE}`)
  console.log(`  WebSocket at ws://localhost:${PORT}/ws`)
})
