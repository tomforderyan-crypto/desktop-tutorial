import type { FirebaseApp } from 'firebase/app'
import type { Database } from 'firebase/database'
import { getFirebaseConfig, type FirebaseOverlayConfig } from './firebaseConfig'
import type { OverlayState } from './overlay'

// firebase is dynamically imported (rather than a static top-level import)
// so the tracker's main bundle never pays for the Firebase SDK unless an
// operator has actually saved a config in Settings.

let cachedApp: FirebaseApp | null = null
let cachedDb: Database | null = null
let cachedConfigKey = ''

async function getDb(config: FirebaseOverlayConfig): Promise<Database> {
  const key = JSON.stringify(config)
  if (cachedDb && cachedConfigKey === key) return cachedDb
  const [{ initializeApp, deleteApp }, { getDatabase }] = await Promise.all([
    import('firebase/app'),
    import('firebase/database'),
  ])
  if (cachedApp) await deleteApp(cachedApp).catch(() => {})
  cachedApp = initializeApp(config, `fieldside-overlay-${Date.now()}`)
  cachedConfigKey = key
  cachedDb = getDatabase(cachedApp)
  return cachedDb
}

function overlayPath(gameId: string): string {
  return `overlays/${gameId}`
}

/** Best-effort push of the latest game state — never throws, so a missing
 * or broken Firebase config can't take down the tracker itself. */
export async function publishOverlayState(gameId: string, state: OverlayState): Promise<void> {
  const config = getFirebaseConfig()
  if (!config) return
  try {
    const db = await getDb(config)
    const { ref, set } = await import('firebase/database')
    await set(ref(db, overlayPath(gameId)), state)
  } catch {
    // Overlay sync is a nice-to-have for the tracker itself — swallow errors.
  }
}

/** Used by the Settings page to validate a config before saving it — unlike
 * publishOverlayState, this reports success/failure instead of swallowing
 * errors, and takes the config directly rather than reading it from storage. */
export async function testFirebaseConnection(
  config: FirebaseOverlayConfig,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const db = await getDb(config)
    const { ref, set } = await import('firebase/database')
    await set(ref(db, 'overlays/_connectionTest'), { checkedAt: new Date().toISOString() })
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Could not reach Firebase.' }
  }
}

/** Subscribes the overlay page to live updates for a game. Returns an
 * unsubscribe function; calls onError (instead of throwing) if there's no
 * saved config or the database can't be reached. */
export function subscribeOverlayState(
  gameId: string,
  onState: (state: OverlayState | null) => void,
  onError?: (message: string) => void,
): () => void {
  const config = getFirebaseConfig()
  if (!config) {
    onError?.('No Firebase config saved in this browser — open Settings to add one.')
    return () => {}
  }

  let cancelled = false
  let stop: (() => void) | null = null

  getDb(config)
    .then(async (db) => {
      if (cancelled) return
      const { ref, onValue } = await import('firebase/database')
      const unsubscribe = onValue(
        ref(db, overlayPath(gameId)),
        (snapshot) => onState(snapshot.val() as OverlayState | null),
        () => onError?.('Could not reach Firebase — check the config and database rules.'),
      )
      stop = unsubscribe
    })
    .catch(() => onError?.('Could not reach Firebase — check the config and database rules.'))

  return () => {
    cancelled = true
    stop?.()
  }
}
