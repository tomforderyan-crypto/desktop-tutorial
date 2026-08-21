import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-[var(--color-border)] bg-[var(--color-ink)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl leading-none tracking-wide text-[var(--color-amber)]">FIELDSIDE</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
            live stat tracker
          </span>
          <Link
            to="/settings"
            className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-amber-soft)]"
          >
            Overlay Settings
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
