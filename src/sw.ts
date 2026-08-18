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

  // `vibrate` is part of the Notifications API spec but missing from lib.dom's
  // NotificationOptions typing, so it's added via the wider signature below.
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag ?? 'pit-lane-nudge',
    data: { url: payload.url ?? '/' },
    vibrate: [80, 40, 80],
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

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
