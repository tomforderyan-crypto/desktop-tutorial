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

A plain `npm run build` targets the root path (matches `npm run preview`
and any other static host); CI sets `GITHUB_PAGES=true` to build with the
`/desktop-tutorial/` prefix instead. The app uses a hash router
specifically so it works as a GitHub Pages project site with no
server-side rewrites needed.

## Project structure

```
src/
  components/   Scoreboard, PlayerPicker, LeadersPanel, milestone toasts, shared UI
  context/      GameContext — the active game + persistence
  lib/          stats/milestone derivation, MaxPreps parsing, player
                suggestion ordering, play descriptions, formatting
  pages/        Home, New Game, Lineup, Live Game, Box Score
  state/        down/distance engine, penalty rules, the play-logging
                engine, new-game/lineup factories
  storage/      localStorage-backed game repository
  types/        the Game/Play/Team/Player data model
```
