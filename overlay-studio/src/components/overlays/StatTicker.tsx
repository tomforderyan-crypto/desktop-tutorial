import type { TickerState } from '../../types'

export default function StatTicker({ state }: { state: TickerState }) {
  if (!state.visible) return null
  const text = state.items.length > 0 ? state.items.map((i) => i.text).join('     •     ') : 'No stats loaded yet'

  return (
    <div className="fixed inset-x-0 bottom-0 flex h-14 items-stretch overflow-hidden bg-black/85 shadow-2xl">
      {state.headline && (
        <div className="flex shrink-0 items-center bg-[var(--color-accent)] px-5">
          <span className="font-display text-xl font-bold tracking-widest text-white">{state.headline}</span>
        </div>
      )}
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div
          className="absolute whitespace-nowrap font-mono text-lg font-medium text-white"
          style={{ animation: `ticker-scroll ${Math.max(5, state.speedSec)}s linear infinite` }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
