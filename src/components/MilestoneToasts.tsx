import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import { detectNewMilestones, type Milestone } from '../lib/milestones'

interface Toast extends Milestone {
  toastId: string
}

export function MilestoneToasts() {
  const { game, setGame } = useGame()
  const [toasts, setToasts] = useState<Toast[]>([])
  const playCount = game.plays.length

  useEffect(() => {
    const alreadyFired = new Set(game.firedMilestones)
    const found = detectNewMilestones(game, alreadyFired)
    if (found.length === 0) return

    setGame((g) => ({ ...g, firedMilestones: [...g.firedMilestones, ...found.map((m) => m.key)] }))
    const withToastIds = found.map((m) => ({ ...m, toastId: `${m.key}-${Date.now()}` }))
    setToasts((prev) => [...prev, ...withToastIds])

    for (const t of withToastIds) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.toastId !== t.toastId)), 9000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-scan when the play log grows
  }, [playCount])

  const dismiss = (toastId: string) => setToasts((prev) => prev.filter((t) => t.toastId !== toastId))

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <div
          key={t.toastId}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-[var(--color-amber)]/50 bg-[var(--color-surface)] px-4 py-3 shadow-xl"
        >
          <span className="text-xl">🏈</span>
          <p className="flex-1 text-sm font-semibold text-[var(--color-amber-soft)]">{t.label}</p>
          <button
            type="button"
            onClick={() => dismiss(t.toastId)}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
