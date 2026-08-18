import webPush from 'web-push'
import { listSubscribers, markNudgeSent, markReminderSent, removeSubscriber } from './store.js'

const NUDGE_COOLDOWN_MS = 20 * 60 * 60 * 1000 // avoid nagging more than ~once/day
const REMINDER_WINDOW_MIN_MS = 25 * 60 * 1000
const REMINDER_WINDOW_MAX_MS = 40 * 60 * 1000

async function send(subscription, payload) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      removeSubscriber(subscription.endpoint)
    } else {
      console.error('push send failed', err.statusCode, err.body)
    }
  }
}

export async function runNudgeSweep() {
  const now = Date.now()
  const subscribers = listSubscribers()

  for (const entry of subscribers) {
    const { subscription, daysBehind, nextScheduled, lastNudgeAt, lastReminderKey } = entry

    if (daysBehind > 0) {
      const cooldownOk = !lastNudgeAt || now - new Date(lastNudgeAt).getTime() > NUDGE_COOLDOWN_MS
      if (cooldownOk) {
        await send(subscription, {
          title: "You're falling behind",
          body: `You're ${daysBehind} day${daysBehind === 1 ? '' : 's'} behind your posting schedule. A quick short-form post gets you back on track.`,
          url: '#/calendar',
          tag: 'streak-nudge',
        })
        markNudgeSent(subscription.endpoint)
      }
    }

    if (nextScheduled?.date && nextScheduled?.time) {
      const scheduledAt = new Date(`${nextScheduled.date}T${nextScheduled.time}:00`)
      const diff = scheduledAt.getTime() - now
      const reminderKey = `${nextScheduled.date}T${nextScheduled.time}`
      if (diff > REMINDER_WINDOW_MIN_MS && diff < REMINDER_WINDOW_MAX_MS && lastReminderKey !== reminderKey) {
        await send(subscription, {
          title: 'Posting time coming up',
          body: `"${nextScheduled.title}" is scheduled for ${nextScheduled.time}. Get it ready to go out on time.`,
          url: '#/calendar',
          tag: 'post-reminder',
        })
        markReminderSent(subscription.endpoint, reminderKey)
      }
    }
  }
}
