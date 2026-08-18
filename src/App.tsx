import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import IdeasPage from './pages/IdeasPage'
import CalendarPage from './pages/CalendarPage'
import RevenuePage from './pages/RevenuePage'
import SettingsPage from './pages/SettingsPage'

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading analytics…</p>}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
