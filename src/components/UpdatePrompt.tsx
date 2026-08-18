import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registration?.update()
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-30 w-[92%] max-w-sm -translate-x-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 shadow-lg md:bottom-6">
      <p className="text-sm">A new version of Pit Lane is ready.</p>
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-md px-3 py-1.5 text-xs text-[var(--color-text-muted)]"
        >
          Later
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
