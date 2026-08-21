// The overlay graphic (loaded as an OBS Browser Source, a separate browser
// process from wherever the tracker runs) can't read this browser's
// localStorage directly, so live game state is relayed through a Firebase
// Realtime Database the operator points both sides at. The config below is
// not a secret — it's the public client config Firebase expects in
// browser code — so storing it in localStorage (entered via the Settings
// page) keeps the app a static, backend-free deploy per operator's own
// Firebase project.

export interface FirebaseOverlayConfig {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  appId: string
}

const KEY = 'fieldside:firebaseConfig'

export function getFirebaseConfig(): FirebaseOverlayConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FirebaseOverlayConfig>
    if (!parsed.apiKey || !parsed.databaseURL || !parsed.projectId || !parsed.appId) return null
    return parsed as FirebaseOverlayConfig
  } catch {
    return null
  }
}

export function saveFirebaseConfig(config: FirebaseOverlayConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config))
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(KEY)
}
