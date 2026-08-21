import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ControlPage from './pages/ControlPage'
import OverlayPage from './pages/OverlayPage'
import { StudioProvider } from './state/StudioContext'

export default function App() {
  return (
    <StudioProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/overlay/:kind" element={<OverlayPage />} />
      </Routes>
    </StudioProvider>
  )
}
