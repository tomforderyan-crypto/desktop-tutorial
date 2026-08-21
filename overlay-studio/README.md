# Overlay Studio

Your own version of [overlays.uno](https://overlays.uno) — custom broadcast
graphics (scoreboard, watermark, play clock, stat ticker) that you control
live from a control panel, with URLs you paste into OBS as Browser Sources.
Completely separate from the Fieldside app in this repository — different
folder, different app, nothing shared.

## What it does

- **Control Panel** (`/control`) — edit team names/colors/logos, scores,
  clock, ticker text, start/pause the play clock, and load player/stat data
  from a JSON file or a Google Sheet.
- **Overlays** (`/overlay/scoreboard`, `/overlay/watermark`,
  `/overlay/playclock`, `/overlay/ticker`) — transparent full-screen pages,
  one per graphic, meant to be added to OBS as Browser Sources. Each one
  updates live as you edit it in the Control Panel.

## Live URL

`../.github/workflows/deploy-pages.yml` (shared with the Fieldside app at
the repo root) builds and deploys this app on every push to `main`, live at
`https://<owner>.github.io/desktop-tutorial/overlay-studio/` — use that
same URL both to open the Control Panel (`#/control`) from any browser and
as the Browser Source URLs you paste into OBS, so nothing depends on your
computer staying on and running `npm run dev`.

## Getting started

```bash
cd overlay-studio
npm install
npm run dev        # http://localhost:5173
```

Open `http://localhost:5173/#/` in your browser — that's the home page with
a card for each overlay and a **Copy** button next to its URL.

```bash
npm run build       # typecheck + production build
npm run lint         # oxlint
npm run preview      # serve the production build locally
```

## Setting it up in OBS (same computer as your control panel)

Use the **live URL** (above) for everything below — no need to keep a
terminal running `npm run dev` open during a broadcast. (Running locally
instead works exactly the same way, just with `http://localhost:5173`
URLs in place of the `github.io` ones.)

1. In OBS, for each overlay you want on screen: **Sources → + → Browser
   Source**. Paste that overlay's URL (from the home page or the Control
   Panel), set width/height to your canvas size (e.g. 1920×1080), and make
   sure **"Shutdown source when not visible"** is **unchecked**.
2. To edit things live *while OBS is open*, add the Control Panel as an OBS
   **dock** instead of using a normal browser tab: **View → Docks → Custom
   Browser Docks…**, give it a name, and paste
   `https://<owner>.github.io/desktop-tutorial/overlay-studio/#/control`.

   This step matters: OBS Browser Sources and Custom Browser Docks share
   one internal browser engine, so changes you make in the docked Control
   Panel appear instantly in your Browser Sources. If you instead edit from
   a regular Chrome/Firefox tab, it's a *different* browser and won't sync
   live — you'd have to keep refreshing the Browser Source by hand. Two
   regular tabs of the **same** browser sync fine with each other too, if
   you just want to preview an overlay without OBS.
3. Everything you set is also saved in that browser's storage, so reopening
   the Control Panel dock keeps your last scores/settings.

## Loading player/game data

On the **Data Source** tab of the Control Panel:

- **JSON file / paste** — paste or upload a JSON array of objects, one per
  player/row, e.g.:
  ```json
  [
    { "name": "J. Smith", "carries": "12", "yards": "84" },
    { "name": "A. Lee", "carries": "9", "yards": "61" }
  ]
  ```
- **Google Sheet** — in your sheet, go to **File → Share → Publish to
  web**, choose the sheet/tab, pick **Comma-separated values (.csv)**, and
  paste that link into the Control Panel. Click **Fetch now** any time your
  sheet changes and updated it'll re-read the latest rows (it does not
  auto-refresh on a timer — the free, no-backend version is refresh-on-demand).

Either way, the loaded rows show up in a preview table, and on the **Stat
Ticker** tab you can write a template like:

```
{name} — {carries} CAR, {yards} YDS
```

`{field}` is replaced by that column for every row, one ticker line each.

## Notes on how live sync works (no backend)

There's no server, database, or login — state lives in the browser via
`localStorage` and is pushed to other same-browser tabs/docks instantly via
`BroadcastChannel`. That's what "same-device only" means in practice: it
works great for one computer running both OBS and the Control Panel (as a
Dock, per above), but a phone or a second computer can't push updates to
this OBS in real time without adding a real backend — a natural next step
if you outgrow single-device control.

## Project structure

```
overlay-studio/
  src/
    components/
      overlays/     Scoreboard, WatermarkBug, PlayClock, StatTicker — the actual graphics
      ui.tsx         shared control-panel UI (buttons, inputs, toggles…)
    lib/
      sync.ts         BroadcastChannel + localStorage state bus
      dataSource.ts    JSON/Google-Sheets-CSV loading into roster rows
      csv.ts            small CSV parser
      playClock.ts       countdown math shared by the overlay and the control panel preview
      overlayUrl.ts       builds each overlay's OBS Browser Source URL
    state/
      StudioContext.tsx  the single shared state object + patch/set helpers
    pages/
      HomePage.tsx        overlay list + copyable URLs
      ControlPage.tsx      tab shell
      control/              one file per Control Panel tab
      OverlayPage.tsx        renders one overlay full-bleed, transparent, for OBS
    types/
      index.ts             the whole data model (StudioState)
```
