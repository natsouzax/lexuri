# Verbly

AI-powered English learning app built with Next.js, Supabase, and OpenAI.

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes, Supabase (Postgres + Auth + Realtime)
- **AI:** OpenAI GPT-4o (chunk detection), GPT-4-mini (flashcards)
- **Payments:** Stripe Checkout + Billing Portal
- **Testing:** Vitest

---

## Getting started

```bash
npm install
cp .env.local .env.local.example   # fill in your keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service-role key (server only) |
| `OPENAI_API_KEY` | ✅ | OpenAI key |
| `GENIUS_API_KEY` | ✅ | Genius.com lyrics API key |
| `STRIPE_SECRET_KEY` | Payments | `sk_test_…` from Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Payments | `whsec_…` from Stripe webhook settings |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | `pk_test_…` from Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | Payments | Stripe Price ID for the Pro plan |
| `NEXT_PUBLIC_APP_URL` | Payments | App base URL, e.g. `http://localhost:3000` |
| `LMS_API_URL` | LMS (optional) | Base URL of your LMS REST API |
| `LMS_API_KEY` | LMS (optional) | Bearer token for LMS API |

---

## Database migrations

Run migrations in order in the Supabase SQL editor or via the Supabase CLI:

```
supabase/migrations/0001_flashcards.sql
supabase/migrations/0002_profiles.sql
supabase/migrations/0003_native_language.sql
supabase/migrations/0004_subscriptions.sql   ← Feature 1: Payments
supabase/migrations/0005_analytics.sql       ← Feature 2: Analytics
supabase/migrations/0006_notifications.sql   ← Feature 3: Notifications (+ enable Realtime)
supabase/migrations/0007_gamification.sql    ← Feature 4: Gamification
```

After running `0006`, enable Realtime on the `notifications` table in the Supabase dashboard:
**Table Editor → notifications → Enable Realtime**.

---

## API reference

### Feature 1 — Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/create-checkout-session` | Required | Start Stripe Checkout; body: `{ price_id }` |
| `POST` | `/api/payments/webhook` | Public (signature verified) | Stripe webhook — updates `subscriptions` table |
| `GET` | `/api/payments/status` | Required | Returns `{ subscription, is_active }` |
| `POST` | `/api/payments/create-portal-session` | Required | Opens Stripe Customer Portal |

**Stripe webhook setup:**
1. Install Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`
2. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### Feature 2 — Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analytics/track` | Required | Record an event; body: `{ event, payload }` |

Allowed events: `flashcard_review`, `session_start`, `session_end`, `payment_complete`, `video_sync_play`, `chunk_detected`, `flashcard_created`.

All flashcard reviews are automatically tracked via the review route.

### Feature 3 — Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/notifications/send` | Required | Create notification; body: `{ user_id, title, body, data }` |
| `PATCH` | `/api/notifications/:id/read` | Required | Mark single notification as read |
| `PATCH` | `/api/notifications/all/read` | Required | Mark all notifications as read |

The `NotificationBell` component subscribes to Supabase Realtime and shows a live badge counter.

### Feature 4 — Gamification & Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/gamification/award` | Required | Award points; body: `{ quality, responseTimeSec?, eventId }` |
| `GET` | `/api/gamification/leaderboard` | Required | `?window=weekly\|monthly\|alltime&page=1` |
| `GET` | `/api/reports/performance` | Required | `?from=ISO&to=ISO` — KPIs: accuracy, avg time, retention, streak |

Points are automatically awarded on each flashcard review (via the review route).

**Scoring rules:**
- Base: 10 pts for quality ≥ 3
- Quality multipliers: q=5 ×1.5, q=4 ×1.2, q=3 ×1.0, q<3 = 0
- Speed: <10s +10%, >60s −20%
- First review of day: +5 pts
- Streak bonus: 7d=+50, 14d=+100, 30d=+250 pts
- Daily cap: 2000 pts

**Badges:** Novice (10 reviews), Consistent (7-day streak), Marathoner (500 reviews), Speedster (50 fast reviews), Streak Master (30-day streak), Centurion (1000 pts).

### Feature 5 — Offline Mode

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/offline/sync` | Required | Apply queued offline review; body: `{ clientId, cardId, quality, responseTimeSec?, reviewedAt }` |

**Client usage** (import from `lib/offline.ts`):
```ts
import { queueReview, syncPendingMutations } from '@/lib/offline'

// Queue review when offline:
await queueReview({ clientId: crypto.randomUUID(), cardId, quality, reviewedAt: new Date().toISOString(), synced: false })

// Sync when back online:
window.addEventListener('online', () => syncPendingMutations())
```

Conflict policy: **last-write-wins**. The server applies the queued review even if the card was reviewed online in the interim.

Service Worker at `public/sw.js` — register it in your root layout:
```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

### Feature 6 — LMS Integration

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/lms/sync` | Required | `{ direction: "export" \| "import" }` |

**Export:** POSTs user progress JSON to `LMS_API_URL/progress`.  
**Import:** GETs progress from `LMS_API_URL/progress/:userId`.

Set `LMS_API_URL` and optionally `LMS_API_KEY` to enable. Returns `501` if not configured.

---

## Running tests

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Tests cover:
- Gamification points calculation and streak bonuses (`__tests__/gamification.test.ts`)
- Stripe webhook signature verification (`__tests__/payments-webhook.test.ts`)
- Analytics event validation (`__tests__/analytics.test.ts`)

---

## Pages added

| Route | Description |
|---|---|
| `/settings/billing` | Subscription status + upgrade/portal buttons |
| `/leaderboard` | Points leaderboard (weekly / monthly / all time) |
| `/reports` | Personal performance KPIs |

---

## Deployment

Deploy on [Vercel](https://vercel.com). Set all env vars in the Vercel project settings.

For Stripe webhooks in production:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`
