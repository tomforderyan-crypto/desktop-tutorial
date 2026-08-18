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

### Hosting the push server on Render (free tier)

`render.yaml` at the repo root is a Render Blueprint that points at `server/`.

1. Sign up at [render.com](https://render.com) (no credit card needed for
   the free tier) and connect your GitHub account.
2. **New +** → **Blueprint** → pick this repo. Render reads `render.yaml`
   and proposes a `pit-lane-push-server` web service — accept it.
3. It'll prompt for four environment variables since they're marked
   `sync: false` in the blueprint — that means Render asks for them at
   setup time instead of expecting them in `render.yaml`, so they never
   end up committed to this public repo. Get a key pair by running
   `npm run generate-vapid` in `server/` (see above) and paste its output
   in as `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`; set `VAPID_SUBJECT` to
   a `mailto:` you control, and `ALLOWED_ORIGIN` to your GitHub Pages
   origin (`https://<your-username>.github.io`, no trailing path).
   Treat `VAPID_PRIVATE_KEY` like a secret — paste it only into Render's
   environment variable field, never into a file that gets committed.
4. Deploy. Render gives you a URL like
   `https://pit-lane-push-server.onrender.com` — copy it.
5. In the app: **Settings → Push notifications → Push server URL**, paste
   that URL in place of `http://localhost:8787`, save, then **Enable
   notifications**.

**Free-tier caveats, so they don't surprise you:**
- The service spins down after ~15 minutes with no incoming requests and
  wakes on the next one — so a nudge check can be delayed until something
  hits the server (opening the app pings it via the streak-status call,
  which helps). This isn't fixable on the free plan; Render's paid tier
  ($7/mo) removes it.
- The free plan has no persistent disk, so `subscriptions.json` resets
  on every deploy and on some cold-start cycles — if notifications stop
  arriving, re-open **Settings → Push notifications** and hit **Enable**
  again to re-subscribe.

### Building for production

```bash
npm run build
npm run preview
```

### Deploying the frontend (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds and publishes `dist/` on every
push to `main`. One manual, one-time step is required first (GitHub
doesn't allow this to be automated from a workflow file):

1. On GitHub: **Settings → Pages → Build and deployment → Source** → set
   to **GitHub Actions**.
2. Push to `main` (or run the workflow manually from the **Actions** tab)
   and wait for the `Deploy to GitHub Pages` run to finish.
3. Your app is live at `https://<owner>.github.io/desktop-tutorial/`. Open
   that URL on your phone and use Add to Home Screen (iOS Safari: Share →
   Add to Home Screen; Android Chrome: menu → Install app) to install it.

A plain `npm run build` targets the root path (matches `npm run preview`
and any other static host); the CI workflow sets `GITHUB_PAGES=true` to
build with the `/desktop-tutorial/` prefix instead. To reproduce that
build locally: `GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npm run preview`.

The app builds with `base: '/desktop-tutorial/'` and uses a hash router
(`/#/calendar`, etc.) specifically so it works as a GitHub Pages project
site with no server-side rewrites needed. If you ever move it to a domain
you control (custom domain, or hosting it at the root of its own host),
drop the `base` override in `vite.config.ts` back to `/`.

**Push notifications need the companion server hosted separately** — a
static host like GitHub Pages can't run the always-on Node process in
`server/`. GitHub Pages alone gets you the full installable app (ideas,
calendar, analytics, revenue — everything backed by on-device IndexedDB);
until you host `server/` somewhere that stays running (a small VPS,
Fly.io, Render, etc.), the "Enable notifications" button in Settings will
surface a clear error instead of silently failing. Once it's hosted, set
`ALLOWED_ORIGIN` in `server/.env` to your GitHub Pages origin and point
the app's push server URL at it in Settings.

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
