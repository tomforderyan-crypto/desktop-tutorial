# Wake County Speedway — Fan App

Native iOS fan app for Wake County Speedway (MyRacePass track ID `2800`),
built with React Native (Expo managed workflow) targeting the Apple App
Store. This is a clean-slate build — no code from any prior prototype was
reused, though the earlier HTML prototype's navigation/IA ideas and the
points-standings Google Apps Script informed the data model below.

A small backend lives alongside this app in
[`../wake-county-speedway-backend`](../wake-county-speedway-backend/README.md) —
it holds the Mux and Stripe secrets and serves the editable-without-a-release
content (banner ads, food vendors, social accounts). Run it locally (or
point at a deployed instance) and set `EXPO_PUBLIC_CMS_BASE_URL` to enable
the real merch checkout and live-status feed; without it, both fall back to
mocks so the app still runs standalone.

## Why Expo

Plain React Native CLI needs Xcode/CocoaPods to do anything, which isn't
available in this build environment and isn't needed yet since the Apple
Developer enrollment is still pending anyway. Expo's managed workflow is
still React Native under the hood (same `react-native` core, same APIs) and
lets the whole app — screens, navigation, mock data — be built and
typechecked now. `react-native-iap` and `@stripe/stripe-react-native` are
both native modules; full StoreKit and real-card testing require an EAS
Build or bare workflow once enrollment clears (Stripe's PaymentSheet in
particular needs a custom dev client — it isn't available in plain Expo Go).

## Status of the two pending blockers

- **Apple Developer enrollment pending** — blocks: real StoreKit
  subscription testing, push notification certificates (APNs), and any
  TestFlight/App Store submission. Everything else runs today in Expo Go
  or a simulator build.
- **MyRacePass API key pending** — blocks: live standings/schedule/driver
  data. `src/api/myRacePassClient.ts` has `USE_MOCK = true` and returns
  data from `src/api/mockData.ts`, shaped to match MyRacePass's v2 track
  feeds as closely as could be inferred without the real key. Once the key
  arrives: set `EXPO_PUBLIC_MYRACEPASS_API_KEY`, flip `USE_MOCK` to
  `false`, and diff the real response against `src/api/types.ts` — field
  names may need small adjustments, but every screen already reads through
  those types rather than raw JSON.

## Architecture

```
App.tsx                  Providers (Cart, Subscription) + RootNavigator
src/
  api/                    All external data access, each with a USE_MOCK
                          flag and a real-fetch path already written:
    types.ts              MyRacePass response shapes (track 2800)
    mockData.ts           Mock standings/drivers/schedule/classes
    myRacePassClient.ts   Standings, drivers, classes, schedule
    weather.ts            Race-day weather (OpenWeatherMap shape)
    mux.ts                Livestream live/offline status + playback ID
    cms.ts                Banner ads / food vendors / social accounts,
                           backed by a lightweight backend with local
                           fallback (see config/)
    socialFeed.ts          Social post feed (Meta Graph API shape)
    gallery.ts             Event photo/video gallery
    merchCatalog.ts         Merch product catalog
  config/                 Local fallback content editable without touching
                          screen code: bannerAds.ts, foodVendors.ts,
                          socialAccounts.ts
  navigation/             Bottom tabs (Home/Standings/Schedule/Merch/More)
                          + a More stack + root-level detail screens
  screens/                One file per feature screen (see below)
  components/             Shared UI: cards, banner carousel, weather
                          widget, live badge
  context/                CartContext (merch), SubscriptionContext (Fan Pass)
  services/               subscription.ts (StoreKit), merchCheckout.ts
                          (Stripe PaymentIntent + PaymentSheet),
                          notifications.ts (push)
  theme/                  Colors, spacing, typography
docs/
  PUSH_NOTIFICATIONS.md   How staff send a rainout alert today, no admin
                          app required
```

## The 12 features → where they live

1. **Point Standings** — `screens/StandingsScreen.tsx` (by division) →
   `StandingsDetailScreen.tsx`, from `api/myRacePassClient.ts`.
2. **Merchandise Store** — `screens/merch/*` (Catalog → Product Detail →
   Cart → Checkout), `context/CartContext.tsx`, `services/merchCheckout.ts`
   (Stripe PaymentSheet against the backend, mock fallback with no backend).
3. **Livestream Link** — `screens/LivestreamScreen.tsx`, `api/mux.ts`,
   gated by `context/SubscriptionContext.tsx`.
4. **Social Media Feed** — `screens/SocialFeedScreen.tsx`,
   `api/socialFeed.ts`, accounts in `config/socialAccounts.ts`.
5. **Food Vendor Highlights** — `screens/FoodVendorsScreen.tsx`,
   `config/foodVendors.ts`.
6. **Race Schedule** — `screens/ScheduleScreen.tsx`, recurrence field on
   `MpEvent` in `api/types.ts`.
7. **Promotional Banner Ads** — `components/BannerAdCarousel.tsx`,
   `config/bannerAds.ts`, both swappable to a real CMS via `api/cms.ts`.
8. **Event Media Gallery** — `screens/GalleryScreen.tsx` →
   `EventGalleryScreen.tsx`, `api/gallery.ts`.
9. **Track Info & Rules** — `screens/TrackInfoScreen.tsx` (static copy,
   edit directly — no backend needed for content this stable).
10. **Weather Widget** — `components/WeatherWidget.tsx`, `api/weather.ts`.
11. **Driver Profiles** — `screens/DriverListScreen.tsx` /
    `DriverProfileScreen.tsx`, same MyRacePass feed as standings.
12. **Push Notifications** — `services/notifications.ts` (device-side),
    `docs/PUSH_NOTIFICATIONS.md` (staff-side sending).

## App Store policy: payments (read this before wiring real payments)

The brief calls for a flat monthly subscription (replacing PPV) *and* a
merch store — these are **not the same payment flow** under Apple's App
Store Review Guidelines, and mixing them up is a common rejection reason:

- **Flat monthly Fan Pass subscription (livestream access)** — this is
  digital content consumed inside the app, so Guideline 3.1.1 makes
  Apple's in-app purchase (StoreKit) **mandatory**. Implemented in
  `services/subscription.ts` against `react-native-iap`'s real API,
  currently mocked (`USE_MOCK = true`) since it needs a native build and an
  App Store Connect subscription group that can't be created until the
  developer enrollment clears.
- **Merch store (t-shirts, hats, diecast, etc.)** — these are physical
  goods shipped to the fan. Guideline 3.1.5(a) exempts physical
  goods/services from the IAP requirement, and Apple does not allow
  StoreKit to be used for a shipped physical good in the first place.
  `services/merchCheckout.ts` is deliberately **not** StoreKit — checkout
  uses `@stripe/stripe-react-native`'s PaymentSheet against a PaymentIntent
  created by the backend (`wake-county-speedway-backend`, which holds the
  Stripe secret key and is the source of truth for prices), and the
  checkout screen says so explicitly to the fan.

Net: only the subscription goes through StoreKit. If a future feature adds
digital-only merch (a wallpaper pack, a digital program), that would need
StoreKit too — but nothing in today's catalog qualifies.

## Getting started

```bash
npm install
npx expo start        # then press i for the iOS simulator, or scan with Expo Go
npm run typecheck
```

Environment variables (all optional — everything mocks by default):

- `EXPO_PUBLIC_MYRACEPASS_API_KEY`
- `EXPO_PUBLIC_OPENWEATHER_API_KEY`
- `EXPO_PUBLIC_CMS_BASE_URL` — the backend's URL (banner ads / food vendors
  / social accounts / Mux live-status proxy / Stripe checkout). Run
  `wake-county-speedway-backend` locally at its default `http://localhost:4000`
  to try the real merch checkout flow.
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe's publishable (not secret)
  key; safe to embed client-side. Needed for `StripeProvider` in `App.tsx`
  to actually talk to Stripe rather than just no-op.

## Known gaps to close before App Store submission

- Swap `USE_MOCK = true` in `myRacePassClient.ts` once the MyRacePass key
  arrives (that module documents exactly what to change).
- Deploy `wake-county-speedway-backend` somewhere durable and point
  `EXPO_PUBLIC_CMS_BASE_URL` at it — see that project's README for hosting
  notes and why its current JSON-file storage is a v1 stopgap, not a
  long-term data store.
- Once Apple Developer enrollment clears: create the subscription group +
  `wake-county-speedway` app record in App Store Connect, register the
  Apple Pay merchant ID referenced in `app.json`
  (`merchant.com.wakecountyspeedway.app`), and do an EAS/bare build for
  real StoreKit + Stripe PaymentSheet + APNs testing (none of the three
  fully function in plain Expo Go).
- App icon / splash assets referenced in `app.json` (`./assets/icon.png`,
  `./assets/notification-icon.png`) still need to be supplied.
