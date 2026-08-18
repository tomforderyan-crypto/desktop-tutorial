import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dataFile = path.join(dataDir, 'subscriptions.json')

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify({ subscribers: [] }, null, 2))

function read() {
  return JSON.parse(readFileSync(dataFile, 'utf-8'))
}

function write(data) {
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

export function listSubscribers() {
  return read().subscribers
}

export function upsertSubscriber(subscription) {
  const data = read()
  const existing = data.subscribers.find((s) => s.subscription.endpoint === subscription.endpoint)
  if (existing) {
    existing.subscription = subscription
    existing.updatedAt = new Date().toISOString()
  } else {
    data.subscribers.push({
      subscription,
      daysBehind: 0,
      currentStreak: 0,
      nextScheduled: null,
      lastNudgeAt: null,
      lastReminderKey: null,
      updatedAt: new Date().toISOString(),
    })
  }
  write(data)
}

export function removeSubscriber(endpoint) {
  const data = read()
  data.subscribers = data.subscribers.filter((s) => s.subscription.endpoint !== endpoint)
  write(data)
}

export function updateStreakStatus(endpoint, { daysBehind, currentStreak, nextScheduled }) {
  const data = read()
  const entry = data.subscribers.find((s) => s.subscription.endpoint === endpoint)
  if (!entry) return
  entry.daysBehind = daysBehind
  entry.currentStreak = currentStreak
  entry.nextScheduled = nextScheduled
  entry.updatedAt = new Date().toISOString()
  write(data)
}

export function markNudgeSent(endpoint) {
  const data = read()
  const entry = data.subscribers.find((s) => s.subscription.endpoint === endpoint)
  if (!entry) return
  entry.lastNudgeAt = new Date().toISOString()
  write(data)
}

export function markReminderSent(endpoint, key) {
  const data = read()
  const entry = data.subscribers.find((s) => s.subscription.endpoint === endpoint)
  if (!entry) return
  entry.lastReminderKey = key
  write(data)
}
