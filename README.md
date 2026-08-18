# Pit Lane — Motorsport Content Creator Dashboard

A personal, installable PWA for a solo motorsport content creator to plan
short- and long-form video content across YouTube, YouTube Shorts,
Instagram, Facebook, and X — generate ideas, schedule posts, track
analytics and revenue once live, and stay accountable to a posting
schedule via real push notifications.

## Features

- **Idea Generator** — starts broad across general motorsport topics, then
  weights suggestions toward whatever sub-topics are performing best once
  analytics exist. Each idea is blended with an "inspiration" note pulled
  from what similar creators are currently doing well (framed as
  inspiration, never copying). Like an idea to send it straight to the
  calendar with an auto-picked time. Hashtag + caption generation is
  available per idea and per scheduled post.
- **Content Calendar** — month grid with short-form (green) vs long-form
  (blue) color coding and per-entry status (planned/posted/missed); an
  agenda list below shows full detail, caption/hashtags, and lets you mark
  posts posted, edit time/platform, or remove them.
- **Best Time to Post** — baseline per-platform activity estimates that
  automatically hand off to real posting-time analysis once you have
  enough tracked posts on a platform (see `src/lib/bestTime.ts`).
- **Analytics** — mock/placeholder per-platform connect flow, views by
  platform, engagement by topic (the same ranking that drives idea
  weighting), and best-time windows. Architected so each "Connect" button
  is where a real OAuth + API integration slots in later.
- **Revenue Tracking** — monthly income vs. goal, breakdown by source and
  platform, and a correlation pass that surfaces *why* something is
  earning (topic + format + time-of-day + platform), e.g. "Your Formula 1
  short-form posts around 3 PM on Instagram are your highest earners."
- **Streaks & accountability** — a posting streak computed from your
  calendar vs. what actually got marked posted, a "days behind schedule"
  callout, and push nudges once notifications are enabled.
- **Installable PWA with real Web Push** — manifest + custom service
  worker (`src/sw.ts`) with `push`/`notificationclick` handlers, works with
  iOS 16.4+ and Android once added to the home screen. Push is backed by a
  small local server (`/server`) using VAPID.

## Stack

- React 19 + TypeScript + Vite, Tailwind CSS v4, React Router
- Dexie (IndexedDB) for all local data — this is a single-user app, so
  everything except push subscriptions lives entirely on-device
- `vite-plugin-pwa` (injectManifest strategy) for the manifest + service
  worker, Recharts for analytics charts, date-fns for date handling
- A small Express + `web-push` server for delivering real push
  notifications (browsers require a server with VAPID keys to send them —
  there's no way around that from a static frontend alone)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Open Settings → **Load demo data** to seed ~45 days of realistic mock
posts, analytics, and revenue so every page has something to show before
you're actually live. **Clear all data** wipes it again.

### Running the push notification server

Push notifications (streak nudges, posting-time reminders) need the
companion server running:

```bash
cd server
npm install
npm run generate-vapid      # prints a VAPID key pair
cp .env.example .env        # then paste the generated keys in
npm run dev                 # http://localhost:8787
```

In the app, go to **Settings → Push notifications**, confirm the push
server URL (defaults to `http://localhost:8787`), and tap **Enable
notifications**. On iOS this only works once the app is installed to the
home screen (Safari → Share → Add to Home Screen) and opened from there —
Safari does not support Web Push for regular browser tabs.

The server polls every 15 minutes and will:
- nudge you if you're behind your posting schedule (at most once/day per
  subscriber), and
- remind you 25–40 minutes before your next scheduled post.

It stores subscriptions in `server/data/subscriptions.json` (gitignored).
This is intentionally minimal — swap in a real database if you outgrow it.

### Building for production

```bash
npm run build
npm run preview
```

Deploy the frontend (`dist/`) to any static host over HTTPS (required for
service workers/push outside `localhost`) and run `server/` anywhere that
can stay alive continuously (a small VPS, Fly.io, Render, etc.) — set
`ALLOWED_ORIGIN` in `server/.env` to your deployed frontend's origin, and
point the app's push server URL at it in Settings.

## Wiring up real analytics later

Every platform integration point is intentionally centralized:

- `src/lib/bestTime.ts` — `bestWindowsFromAnalytics` already aggregates
  real `AnalyticsSnapshot` rows by hour; once you're pulling real data in,
  the mock baseline in the same file stops being used automatically.
- `src/lib/ideaGenerator.ts` — `computeTopicWeights` already reads from
  the same `analyticsSnapshots` table, so real data immediately starts
  steering idea suggestions.
- Analytics → "Connected platforms" is where OAuth for YouTube Data API,
  Instagram Graph API, Facebook Graph API, and the X API would hang a real
  connect flow; today it just toggles `settings.connectedPlatforms`.

Replacing mock data means writing a sync job (client-side fetch, or a
small backend job hitting each platform's API) that writes rows into the
`analyticsSnapshots` table shaped like `src/types/index.ts`'s
`AnalyticsSnapshot` — nothing else in the app needs to change.

## Project structure

```
src/
  components/   shared UI (Layout/nav, Card/Button/Sheet, icons)
  db/           Dexie schema
  hooks/        settings hook
  lib/          idea generation, hashtags, best-time, streaks, revenue
                insights, push subscription helpers, demo data seeding
  pages/        one file per route
  sw.ts         custom service worker (push, notificationclick, precache)
server/         Express + web-push notification server
```
