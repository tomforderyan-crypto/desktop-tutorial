import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at https://<owner>.github.io/desktop-tutorial/ on GitHub Pages, but at
// the root everywhere else (local dev, `vite preview`, any other static
// host) — the CI deploy workflow sets GITHUB_PAGES=true for its build step.
const BASE = '/desktop-tutorial/'

// https://vite.dev/config/
export default defineConfig(() => {
  const base = process.env.GITHUB_PAGES === 'true' ? BASE : '/'

  return {
    base,
    plugins: [react()],
  }
})
