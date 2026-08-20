// Kill switch for the service worker the previous app (Pit Lane) registered
// at this same path/scope. Fieldside isn't a PWA and ships no service
// worker of its own — but a browser that visited the old app still has that
// worker installed and will keep serving its cached shell forever unless
// something at this exact URL replaces it. This file's only job is to
// unregister itself, wipe any caches it left behind, and reload open tabs
// so they fall through to a normal network fetch of the real app.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})
