/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
// Injected at build time by vite-plugin-pwa (injectManifest strategy).
precacheAndRoute(self.__WB_MANIFEST)

interface NudgePushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: NudgePushPayload = {
    title: 'Pit Lane',
    body: 'You have a new update.',
  }

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.body = event.data.text()
    }
  }

  // Resolve relative to the SW's own scope so this keeps working whether the
  // app is served from the domain root or a subpath (e.g. GitHub Pages).
  const iconUrl = new URL(`${import.meta.env.BASE_URL}icons/icon-192.png`, self.registration.scope).href
  // Notification payload URLs from the push server are hash-route fragments
  // (e.g. "#/calendar"), resolved against scope so they land inside the app.
  const targetUrl = new URL(payload.url ?? '', self.registration.scope).href

  // `vibrate` is part of the Notifications API spec but missing from lib.dom's
  // NotificationOptions typing, so it's added via the wider signature below.
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon ?? iconUrl,
    badge: iconUrl,
    tag: payload.tag ?? 'pit-lane-nudge',
    data: { url: targetUrl },
    vibrate: [80, 40, 80],
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || self.registration.scope

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = allClients.find((c) => 'focus' in c)
      if (existing) {
        await (existing as WindowClient).focus()
        existing.postMessage({ type: 'notification-click', url: targetUrl })
        return
      }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach((c) => c.postMessage({ type: 'push-subscription-changed' }))
    })(),
  )
})
