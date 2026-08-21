# Fieldside — Live Football Stat Tracker

A single-page web app for a one-person broadcast operator (commentator or
producer) to track live play-by-play stats during a high school football
game, for on-air use, then review afterward. Phase 1 is offense-only —
defense is shaped so a defensive lineup can slot in later without a rebuild.

## Features

- **Roster import** — best-effort scrape/parse of a public MaxPreps team
  roster page (jersey #, name, position). MaxPreps has no public API and
  most roster pages are client-rendered, so this fails for a lot of real
  URLs — that's expected. A "paste page source" fallback sidesteps
  browser CORS restrictions for pages that do parse, and manual
  add-a-player is always available regardless (`src/lib/maxpreps.ts`).
  A photo of a printed roster sheet is a third option — on-device text
  recognition (`tesseract.js`) reads off #/name/position per line
  (`src/lib/rosterOcr.ts`), and every result lands in an editable review
  table before anything's added, since OCR on a photo is never perfect.
  Needs an internet connection the first time to fetch the recognizer.
- **Starting lineup & substitutions** — assign QB/RB/WR/TE/OL slots per
  team; plays log against whoever's in the slot *at the time*, so
  swapping a slot mid-drive never touches stat history already recorded
  (`src/state/newGame.ts`, `src/pages/LineupPage.tsx`).
- **Live play entry** — Run, Pass, Sack, Penalty, Field Goal, Safety, and
  Punt, with player suggestions ordered for speed (RBs/QBs first for
  runs, WR/TE first for pass targets, defensive front seven first for
  sacks — `src/lib/playerSuggest.ts`). A full down/distance/penalty
  engine drives field position, first downs, touchdowns, turnovers, and
  the PAT/2pt and kickoff prompts that follow every score
  (`src/state/downDistanceEngine.ts`, `src/state/gameEngine.ts`). Undo
  reverts the last play by replaying the log, not by hand-patching state.
- **Stat leaders panel** — passing/rushing/receiving leaders across both
  rosters, derived live from the play log and built to be glanceable
  enough to read straight off-screen on air (`src/components/LeadersPanel.tsx`).
- **Milestone alerts** — dismissible, non-blocking toasts for in-game
  firsts (first carry, first reception, first play over 10 yards, first
  touchdown, and more), scoped to the current game only
  (`src/lib/milestones.ts`).
- **Post-game box score** — team totals plus full individual stat lines,
  exportable as a PDF via the browser's print dialog
  (`src/pages/BoxScorePage.tsx`).

## Broadcast overlay (OBS/vMix stat card)

A companion "stat card" lower-third for use as a Browser Source during live
commentary, driven off the same play log as everything else — no separate
data entry.

- **Control Panel** (`/#/game/:gameId/control`, linked from the "Overlay
  Control" button on the Live Game page) — a normal browser tab. Set each
  team's primary/secondary hex colors once before kickoff, then click a
  roster player to show their card; click them again (or "Dismiss Card") to
  hide it. Fully manual — nothing shows or hides on a timer.
- **Overlay** (`/#/overlay`) — a transparent, chrome-free page (no header,
  no background) meant only to be pasted into an OBS or vMix Browser Source.
  It shows exactly one broadcast-style stat card, skinned in the selected
  player's team colors, with a snappy slide/fade in and out. The stat line
  shown is chosen by position — passing for QBs, rushing for RBs/FBs,
  receiving for WRs/TEs, sacks for defensive positions (`src/lib/broadcast.ts`).
- **Bridge server** (`server/broadcast-server.mjs`) — a small local Node
  process the Control Panel and Overlay both talk to over a WebSocket, so a
  click in one appears in the other instantly with no polling delay. It also
  writes the live game's stat line for every player out to
  `server/data/stats.json` on every play (the "data bridge"), and persists
  the current overlay selection to `server/data/overlay-state.json` so a
  restart doesn't lose it.

Run it alongside the normal dev server:

```bash
npm run overlay-server   # starts the bridge on http://localhost:8787
npm run dev               # the tracker, control panel, and overlay all live here
```

Paste `http://localhost:5173/#/overlay` into your OBS/vMix Browser Source
(the Control Panel has a copy-to-clipboard button for this URL). The bridge
server is optional — if it isn't running, the tracker itself works exactly
as before; only the overlay/control sync is unavailable.

Defensive stat lines currently show sacks only — the play log doesn't yet
attribute tackles or interceptions to a specific defender, so those aren't
in `stats.json` either.

## Data model

A play is the unit of truth: it records its type, the players involved by
role (passer/target/carrier/defender), yards, the down/distance situation
before and after, and the result. Every derived view — player stat lines,
team totals, milestones, the box score — is computed from the play log
(`src/lib/stats.ts`, `src/lib/milestones.ts`), never stored redundantly, so
they can't drift out of sync. `undoLastPlay` / `recomputeFromPlays` in
`src/state/gameEngine.ts` rebuild the entire game state by replaying the
log, which is also what keeps that log the single source of truth.

Everything lives in the browser (`localStorage`, via
`src/storage/gameRepository.ts`) — no backend, no login. The repository is
the only file that talks to storage, so swapping in a real backend later
means rewriting that one file.

## Stack

- React 19 + TypeScript + Vite, Tailwind CSS v4, React Router (hash router)
- No state library beyond React context — `src/context/GameContext.tsx`
  holds the active game and persists every mutation to `localStorage`

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build       # typecheck + production build
npm run lint         # oxlint
npm run preview      # serve the production build locally
```

### Deploying (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds and publishes `dist/` on every
push to `main`. One manual, one-time step is required first (GitHub
doesn't allow this to be automated from a workflow file):

1. On GitHub: **Settings → Pages → Build and deployment → Source** → set
   to **GitHub Actions**.
2. Push to `main` (or run the workflow manually from the **Actions** tab)
   and wait for the `Deploy to GitHub Pages` run to finish.
3. The app is live at `https://<owner>.github.io/desktop-tutorial/`.

GitHub Pages is static hosting only — it can't run `server/broadcast-server.mjs`,
so the overlay/control panel sync described above only works when running
locally (`npm run dev` + `npm run overlay-server`), which is also what a
Browser Source in OBS/vMix needs anyway (a `localhost` URL, not a hosted one).

A plain `npm run build` targets the root path (matches `npm run preview`
and any other static host); CI sets `GITHUB_PAGES=true` to build with the
`/desktop-tutorial/` prefix instead. The app uses a hash router
specifically so it works as a GitHub Pages project site with no
server-side rewrites needed.

## Project structure

```
src/
  components/   Scoreboard, PlayerPicker, LeadersPanel, milestone toasts,
                StatCard (broadcast overlay card), shared UI
  context/      GameContext — the active game + persistence, and pushes
                broadcast state to the overlay bridge on every change
  lib/          stats/milestone derivation, MaxPreps parsing, player
                suggestion ordering, play descriptions, formatting,
                broadcast.ts (Game → overlay JSON) + broadcastClient.ts
                (WebSocket hook shared by the Overlay/Control Panel pages)
  pages/        Home, New Game, Lineup, Live Game, Box Score, Control Panel,
                Overlay (the transparent OBS/vMix Browser Source page)
  state/        down/distance engine, penalty rules, the play-logging
                engine, new-game/lineup factories
  storage/      localStorage-backed game repository
server/
  broadcast-server.mjs   local Node bridge: stats.json + overlay selection,
                          relayed live over WebSocket (see "Broadcast
                          overlay" above)
  types/        the Game/Play/Team/Player data model
```
