import { NavLink, Outlet } from 'react-router-dom'
import { HomeIcon, BulbIcon, CalendarIcon, ChartIcon, DollarIcon, SettingsIcon } from './icons'
import UpdatePrompt from './UpdatePrompt'
import StreakBadge from './StreakBadge'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/ideas', label: 'Ideas', icon: BulbIcon, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon, end: false },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon, end: false },
  { to: '/revenue', label: 'Revenue', icon: DollarIcon, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-sm font-bold text-white">
            PL
          </div>
          <span className="text-sm font-semibold tracking-wide">Pit Lane</span>
        </div>
        <StreakBadge />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 md:pb-8">
        <div className="mx-auto w-full max-w-4xl">
          <Outlet />
        </div>
      </main>

      <UpdatePrompt />

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur md:sticky">
        <div className="mx-auto flex max-w-4xl justify-between px-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[var(--color-accent-soft)]' : 'text-[var(--color-text-muted)]'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
