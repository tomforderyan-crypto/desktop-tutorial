import { useEffect, useState } from 'react'
import type { PlayClockState } from '../../types'
import { computeRemaining } from '../../lib/playClock'

export default function PlayClock({ state }: { state: PlayClockState }) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!state.running) return
    const id = window.setInterval(() => forceTick((n) => n + 1), 200)
    return () => window.clearInterval(id)
  }, [state.running])

  if (!state.visible) return null

  const remaining = Math.ceil(computeRemaining(state))
  const urgent = remaining <= 5

  return (
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-2xl ${urgent ? 'border-[var(--color-bad)] bg-[var(--color-bad)]/20' : 'border-white/80 bg-black/70'}`}
    >
      <span className={`font-mono text-5xl font-bold tabular-nums ${urgent ? 'text-[var(--color-bad)]' : 'text-white'}`}>{remaining}</span>
    </div>
  )
}
