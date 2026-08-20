import type { Player } from '../types'

export function PlayerAvatar({ player, size = 32 }: { player: Player | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.max(9, size * 0.34) }

  if (player?.photoDataUrl) {
    return (
      <img
        src={player.photoDataUrl}
        alt={player.name}
        style={style}
        className="shrink-0 rounded-full border border-[var(--color-border-bright)] object-cover"
      />
    )
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full border border-[var(--color-border-bright)] bg-[var(--color-surface-alt)] font-mono font-semibold text-[var(--color-text-dim)]"
    >
      {player ? player.number : '—'}
    </div>
  )
}
