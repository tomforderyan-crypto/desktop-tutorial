import type { CSSProperties } from 'react'
import type { BroadcastPlayer, BroadcastTeam } from '../lib/broadcast'
import '../styles/stat-card.css'

export type CardPhase = 'entering' | 'visible' | 'exiting'

/** Picks readable text (+ a matching drop shadow) for a given bar color, so
 * a team whose color is pale (white, yellow, …) doesn't render invisible
 * text-on-near-same-color. Relative luminance per WCAG. */
function contrastTextFor(hex: string): { text: string; shadow: string } {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return { text: '#ffffff', shadow: 'rgba(0, 0, 0, 0.4)' }
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255)
  const [rl, gl, bl] = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
  return luminance > 0.55 ? { text: '#0a0f14', shadow: 'rgba(255, 255, 255, 0.35)' } : { text: '#ffffff', shadow: 'rgba(0, 0, 0, 0.4)' }
}

/** Broadcast-style lower-third stat card — skinned per-team, angled cuts,
 * ESPN-ish. Pure display: phase drives the CSS transition, everything else
 * is already-formatted data from BroadcastPlayer. */
export function StatCard({ player, team, phase }: { player: BroadcastPlayer; team: BroadcastTeam; phase: CardPhase }) {
  const nameBar = contrastTextFor(team.primaryColor)
  const metaBar = contrastTextFor(team.secondaryColor)
  const style = {
    '--team-primary': team.primaryColor,
    '--team-secondary': team.secondaryColor,
    '--name-bar-text': nameBar.text,
    '--name-bar-shadow': nameBar.shadow,
    '--meta-bar-text': metaBar.text,
  } as CSSProperties

  return (
    <div className={`stat-card stat-card--${phase}`} style={style}>
      <div className="stat-card__name-bar">
        <span className="stat-card__number">#{player.number}</span>
        <span className="stat-card__name">{player.name}</span>
      </div>
      <div className="stat-card__meta-bar">
        <span>{player.position}</span>
        <span className="stat-card__dot">•</span>
        <span>{team.name}</span>
      </div>
      {player.statLine.length > 0 && (
        <div className="stat-card__stats">
          {player.statLine.map((s) => (
            <div key={s.label} className="stat-card__stat">
              <span className="stat-card__stat-value">{s.value}</span>
              <span className="stat-card__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
