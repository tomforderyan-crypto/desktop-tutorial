function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission()
}

export async function subscribeToPush(serverUrl: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/vapid-public-key`)
  if (!res.ok) throw new Error('Could not reach push server for VAPID key')
  const { publicKey } = (await res.json()) as { publicKey: string }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  await fetch(`${serverUrl.replace(/\/$/, '')}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })

  return subscription
}

export async function unsubscribeFromPush(serverUrl: string): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await fetch(`${serverUrl.replace(/\/$/, '')}/api/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined)

  await subscription.unsubscribe()
}

export async function pushSubscriptionEndpoint(): Promise<string | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return subscription?.endpoint ?? null
}

export async function reportStreakStatus(
  serverUrl: string,
  payload: { endpoint: string; daysBehind: number; currentStreak: number; nextScheduled: { date: string; time: string; title: string } | null },
): Promise<void> {
  await fetch(`${serverUrl.replace(/\/$/, '')}/api/streak-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined)
}

export async function sendTestPush(serverUrl: string): Promise<void> {
  const endpoint = await pushSubscriptionEndpoint()
  if (!endpoint) throw new Error('Not subscribed to push notifications yet')
  await fetch(`${serverUrl.replace(/\/$/, '')}/api/send-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  })
}
