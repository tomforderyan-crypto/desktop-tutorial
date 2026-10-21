import { Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import SubmitPage from './pages/SubmitPage'
import ReviewPage from './pages/ReviewPage'
import DisplayPage from './pages/DisplayPage'
import { Brand, Notice, Page } from './components/ui'

export default function App() {
  if (!supabase) {
    return (
      <Page>
        <Brand />
        <Notice>
          <strong className="text-[var(--color-text)]">This photo wall isn’t connected yet.</strong> Set{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_KEY</code> as described in <code>photo-wall/README.md</code>, then
          redeploy.
        </Notice>
      </Page>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<SubmitPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/display" element={<DisplayPage />} />
    </Routes>
  )
}
