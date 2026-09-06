# Wake County Speedway — Backend

The small backend behind the [Wake County Speedway](../wake-county-speedway)
app's `EXPO_PUBLIC_CMS_BASE_URL`. It exists for exactly the things that
can't live safely or manageably inside the mobile app itself:

- **Secrets** — the Stripe secret key must never ship inside the app binary.
- **Editable-without-a-release content** — banner ads, food vendors, which
  social accounts feed the app, and the livestream link/live-flag can
  change without an App Store resubmission.
- **Payment** — creating a Stripe PaymentIntent requires a secret key call
  that has to happen server-side.

Express + TypeScript, storing content and orders as JSON files under
`data/` (see `src/jsonStore.ts` for why, and its limits — this is a v1
choice, not a permanent one).

## Endpoints

| Method | Path                          | Auth        | Purpose |
|--------|-------------------------------|-------------|---------|
| GET    | `/banner-ads`                 | none        | Current promotional banners |
| PUT    | `/banner-ads`                 | admin key   | Replace the banner list |
| GET    | `/food-vendors`                | none        | Current food vendor list |
| PUT    | `/food-vendors`                | admin key   | Replace the vendor list |
| GET    | `/social-accounts`             | none        | Accounts the Social tab pulls from |
| PUT    | `/social-accounts`             | admin key   | Replace the account list |
| GET    | `/livestream-link`             | none        | `{ url, label, isLive }` — the stream is hosted elsewhere (YouTube/Facebook Live/etc.); this is just the link + a live flag |
| PUT    | `/livestream-link`             | admin key   | Replace the link/label/live flag |
| POST   | `/checkout/create-payment-intent` | none     | Creates a Stripe PaymentIntent + a `pending` order |
| GET    | `/checkout/orders/:id`         | none        | Order status lookup |
| POST   | `/webhooks/stripe`             | Stripe sig  | Marks an order `paid`/`failed` from Stripe's webhook |
| GET    | `/health`                      | none        | Liveness check |

Admin-key routes expect a `x-admin-key: <ADMIN_API_KEY>` header.

## Going live

There's no video infrastructure here — the stream itself runs entirely on
whatever platform the production partner already broadcasts to (YouTube
Live, Facebook Live, etc.). Staff flip the live flag when a broadcast
starts and ends:

```bash
curl -X PUT https://<backend-url>/livestream-link \
  -H "Content-Type: application/json" \
  -H "x-admin-key: <ADMIN_API_KEY>" \
  -d '{"url":"https://youtube.com/...","label":"Friday Night Racing","isLive":true}'
```

Same call with `"isLive":false` when the broadcast ends. The app polls
this on the Home and Livestream screens to show the live/offline badge.

## Merch pricing lives here, not just in the app

`data/products.seed.json` is the **authoritative** price list used to
compute checkout totals — `/checkout/create-payment-intent` looks up each
line's price by `productId` itself rather than trusting whatever price the
client sends, so a modified app build can't check out a $48 hoodie for a
penny. This list has to be kept in sync by hand with
`wake-county-speedway/src/api/merchCatalog.ts` for now; unifying them into
one product source (this backend serving the app's catalog too) is the
natural next step once there's a reason to add products often.

## Getting started

```bash
cp .env.example .env   # fill in what you have; everything degrades gracefully except Stripe
npm install
npm run dev             # http://localhost:4000, auto-reloads
```

```bash
npm run build && npm start   # production build
npm run typecheck
```

### Stripe webhook locally

```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
```
Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

## Deploying

Any Node host works (Render, Fly.io, Railway, a small VPS) — there's a
`Dockerfile` if that's the preferred path. Whatever you use:

1. Set the env vars from `.env.example`.
2. Point the app's `EXPO_PUBLIC_CMS_BASE_URL` at the deployed URL.
3. Point Stripe's webhook settings at `<your-url>/webhooks/stripe` for the
   `payment_intent.succeeded` and `payment_intent.payment_failed` events.
4. Mount a persistent volume at `data/` — on most PaaS platforms the
   filesystem is ephemeral between deploys, which would silently drop
   banner ad edits and order history. This is the strongest argument for
   moving to a real database before this goes into real use; a persistent
   volume is a stopgap, not a fix.
