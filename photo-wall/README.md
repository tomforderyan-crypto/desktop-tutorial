# Photo Wall

A crowd photo wall for a Jumbotron. People send photos from their phones,
you approve them, and approved photos cycle on a full-screen mosaic you can
load straight into vMix (or OBS, or any browser) with a plain URL. No
sign-in is needed to send photos or to show the display. Only approving
requires signing in.

It's a separate app from Fieldside and Overlay Studio in this repo. The
photos and approvals are stored in a free [Supabase](https://supabase.com)
project, because GitHub Pages can only serve files and can't store anything.

## Pages

| Page | URL (after deploy) | Who it's for |
| --- | --- | --- |
| Send | `https://<owner>.github.io/desktop-tutorial/photo-wall/#/` | Fans. Anyone with the link (or the on-screen QR code) can send photos. |
| Review | `…/photo-wall/#/review` | You. Sign in, then approve or reject. Also has the display settings. |
| Display | `…/photo-wall/#/display` | The Jumbotron. Paste this into vMix. |

The display shows only approved photos. Tiles crossfade on a timer, each
newly approved photo gets a full-screen "Just added" moment, and a corner QR
code points fans at the Send page. Captions, the spotlight, the QR code and
the swap speed can all be switched from the Review page while the display is
running.

## One-time setup (about 10 minutes)

### 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a **New project**
   (the free plan is enough). Pick any name and a region near you.
2. Open **SQL Editor**, paste the whole of [`supabase/setup.sql`](supabase/setup.sql),
   **change `you@example.com` on the last line to your email**, and click
   **Run**. This creates the tables, the storage bucket for photos, and the
   rules for who can do what.
3. Open **Authentication → Users → Add user → Create new user**. Enter the
   same email and a password, and tick **Auto Confirm User**. This is the
   account you'll use on the Review page.
4. Open **Authentication → Sign In / Providers** and turn off **Allow new
   users to sign up**. Only the account you just made should exist. (Even if
   someone made another account, the database only lets the emails in
   `wall_admins` approve photos.)

### 2. Connect GitHub to it

1. In Supabase, open **Project Settings → API Keys** (or **Data API**) and copy
   the **Project URL** and the **publishable key** (older projects call it
   the `anon` `public` key). Both are meant to be public.
2. In GitHub, open this repo's **Settings → Secrets and variables → Actions →
   Variables** tab and add two **repository variables**:
   - `VITE_SUPABASE_URL`: the Project URL
   - `VITE_SUPABASE_KEY`: the publishable (anon) key
3. Re-run the **Deploy to GitHub Pages** workflow from the **Actions** tab (or
   push to `main`).

Until the variables are set, the deployed page says it isn't connected yet.

## Putting it on the Jumbotron with vMix

1. In vMix: **Add Input → Web Browser**.
2. URL: `https://<owner>.github.io/desktop-tutorial/photo-wall/#/display`
3. Set the input's size to your output resolution (for example 1920×1080).

There's no sign-in and nothing to click. New approvals show up within a
second or two, and the page re-checks every 30 seconds in case the
connection drops.

## Things to know before game day

- **Free Supabase projects pause after about a week without activity.** Open
  the Review page (or the Supabase dashboard) the day before a game. If it's
  paused, Supabase shows a **Restore** button.
- **Anyone with the Send link can upload.** Nothing reaches the screen
  without your approval, but uploads still use storage. Rejecting a photo
  deletes it. The free plan includes 1 GB of storage. Photos are resized to
  at most 2048 px before upload, which is usually under 1 MB each.
- **Pending photos are files in a public bucket** with random, unguessable
  names. Nobody can list them or find them without the exact link.

## Local development

```bash
cd photo-wall
cp .env.example .env.local   # then fill in your Supabase URL and key
npm install
npm run dev                  # http://localhost:5173
```

```bash
npm run build       # typecheck + production build
npm run lint        # oxlint
npm run preview     # serve the production build locally
```

## Project structure

```
src/
  components/ui.tsx   buttons, fields, page shell
  lib/supabase.ts     the Supabase client (null until configured)
  lib/photos.ts       send/approve/delete, settings, and the live useWall() hook
  lib/image.ts        resize and rotate photos before upload
  pages/              Send, Review (with sign-in), Display
supabase/setup.sql    tables, storage bucket and access rules
```
