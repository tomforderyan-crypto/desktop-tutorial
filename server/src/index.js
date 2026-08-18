import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import webPush from 'web-push'
import { listSubscribers, removeSubscriber, updateStreakStatus, upsertSubscriber } from './store.js'
import { runNudgeSweep } from './nudges.js'

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PORT = 8787, ALLOWED_ORIGIN } = process.env

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys. Run `npm run generate-vapid` and add them to server/.env, then restart.')
  process.exit(1)
}

webPush.setVapidDetails(VAPID_SUBJECT || 'mailto:you@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const app = express()
app.use(cors({ origin: ALLOWED_ORIGIN || true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, subscribers: listSubscribers().length })
})

app.get('/api/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

app.post('/api/subscribe', (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' })
  upsertSubscriber(subscription)
  res.status(201).json({ ok: true })
})

app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' })
  removeSubscriber(endpoint)
  res.json({ ok: true })
})

app.post('/api/streak-status', (req, res) => {
  const { endpoint, daysBehind, currentStreak, nextScheduled } = req.body
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' })
  updateStreakStatus(endpoint, { daysBehind: daysBehind ?? 0, currentStreak: currentStreak ?? 0, nextScheduled: nextScheduled ?? null })
  res.json({ ok: true })
})

app.post('/api/send-test', async (req, res) => {
  const { endpoint } = req.body
  const entry = listSubscribers().find((s) => s.subscription.endpoint === endpoint)
  if (!entry) return res.status(404).json({ error: 'Subscription not found' })

  try {
    await webPush.sendNotification(
      entry.subscription,
      JSON.stringify({ title: 'Pit Lane', body: 'Test notification — push is working.', url: '/' }),
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// Sweep every 15 minutes for behind-schedule nudges and upcoming post reminders.
cron.schedule('*/15 * * * *', () => {
  runNudgeSweep().catch((err) => console.error('nudge sweep failed', err))
})

app.listen(PORT, () => {
  console.log(`Pit Lane push server listening on http://localhost:${PORT}`)
})
