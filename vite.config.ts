import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served at https://<owner>.github.io/desktop-tutorial/ on GitHub Pages, but at
// the root everywhere else (local dev, `vite preview`, any other static
// host) — the CI deploy workflow sets GITHUB_PAGES=true for its build step.
const BASE = '/desktop-tutorial/'

// https://vite.dev/config/
export default defineConfig(() => {
  const base = process.env.GITHUB_PAGES === 'true' ? BASE : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectRegister: false,
        base,
        manifest: {
          id: base,
          name: 'Pit Lane — Motorsport Creator Dashboard',
          short_name: 'Pit Lane',
          description: 'Plan, schedule, and track motorsport content across every platform.',
          theme_color: '#0b0d10',
          background_color: '#0b0d10',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          scope: base,
          icons: [
            { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
            { src: `${base}icons/maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
  }
})
