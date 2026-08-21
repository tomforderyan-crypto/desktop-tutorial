import type { ScoreboardState, TeamInfo } from '../../types'

function TeamBlock({ team, align, hasPossession }: { team: TeamInfo; align: 'left' | 'right'; hasPossession: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      {team.logoUrl ? (
        <img src={team.logoUrl} alt="" className="h-9 w-9 rounded-sm object-contain" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-sm text-xs font-bold text-white" style={{ backgroundColor: team.color }}>
          {team.abbreviation.slice(0, 3)}
        </div>
      )}
      <div className={align === 'right' ? 'text-right' : 'text-left'}>
        <div className="flex items-center gap-1.5" style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
          <span className="font-display text-xl font-semibold tracking-wide text-white">{team.abbreviation}</span>
          {hasPossession && <span className="h-2 w-2 rounded-full bg-amber-400" />}
        </div>
      </div>
      <div className="font-mono text-3xl font-bold text-white tabular-nums">{team.score}</div>
    </div>
  )
}

export default function Scoreboard({ state }: { state: ScoreboardState }) {
  if (!state.visible) return null
  return (
    <div className="inline-flex flex-col overflow-hidden rounded-md shadow-2xl" style={{ fontFamily: 'inherit' }}>
      <div className="flex items-center gap-6 bg-black/85 px-5 py-2.5 backdrop-blur-sm">
        <TeamBlock team={state.away} align="left" hasPossession={state.possession === 'away'} />
        <div className="flex flex-col items-center px-1">
          <div className="font-display text-lg font-semibold text-white/90">{state.period}</div>
          <div className="font-mono text-sm text-white/70 tabular-nums">{state.clock}</div>
        </div>
        <TeamBlock team={state.home} align="right" hasPossession={state.possession === 'home'} />
      </div>
      {state.downDistance && (
        <div className="bg-[var(--color-accent)] px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
          {state.downDistance}
        </div>
      )}
    </div>
  )
}
