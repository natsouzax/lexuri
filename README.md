# Lexuri — Turn real content into English fluency
![alt text](image.png)

> AI-powered English learning. You bring the content you already enjoy. Lexuri finds every idiom, phrasal verb, and collocation — and makes sure you never forget them.

**[Try it free at lexuri.app](https://lexuri.app)**

---

## Why Lexuri exists

Most learners plateau because they study vocabulary in isolation — words, definitions, flashcards. But fluency isn't about words. It's about *chunks*: the multi-word expressions native speakers reach for automatically.

> *"make sense of"*, *"at the end of the day"*, *"take it for granted"*

These patterns live in the content you already consume — YouTube videos, songs, podcasts. The problem is extracting and retaining them at scale.

**Lexuri automates that.** You pick the content. The AI does the heavy lifting.

---

## How it works

```
1. Paste a YouTube URL or search a song
         ↓
2. AI scans the transcript for real language patterns
         ↓
3. You save the chunks that matter to you
         ↓
4. Spaced repetition brings them back before you forget
         ↓
5. You speak and write like you actually consumed that content
```

---

## Features

| | Feature | What it does |
|---|---|---|
| AI | **Chunk Detection** | GPT-4o finds idioms, collocations, phrasal verbs, and spoken patterns — with meaning and example in context |
| Import | **YouTube** | Paste any URL, get the full transcript analyzed |
| Import | **Music** | Analyze song lyrics via Genius |
| Learning | **Spaced Repetition (SRS)** | SM-2 algorithm — every card surfaces at the right moment |
| Learning | **Quality-graded Review** | Rate your recall 1–5; response time factors into the next interval |
| Progress | **Gamification** | XP, streaks, badges, leaderboard (weekly / monthly / all-time) |
| Progress | **Performance Reports** | Accuracy, retention rate, avg response time, streak, review volume |
| UX | **Offline Mode** | Service Worker + IndexedDB queue — works without internet, syncs on reconnect |
| Onboarding | **Placement Test** | Determines your starting level before you begin |
| Billing | **Free / Pro / Premium** | Stripe Checkout + Billing Portal — no friction to upgrade |
| Notifications | **Daily Reminders** | Real-time bell + email reminders via Resend |

---

## Tech Stack

Built end-to-end by one person.

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, React 19) |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres + RLS + Realtime) |
| AI | OpenAI GPT-4o, Whisper |
| Payments | Stripe Checkout, Billing Portal, Webhooks |
| Email | Resend + React Email |
| Testing | Vitest |
| Deployment | Vercel |

### Architecture highlights

**Server Components by default** — data fetching on the server; client components only where interactivity requires it. Lean bundle, fast initial load.

**Row Level Security at the DB layer** — every query is scoped to the authenticated user in Postgres itself, not just in app code.

**Offline-first review** — reviews queue in IndexedDB when offline and sync via `/api/offline/sync` on reconnect. Last-write-wins conflict resolution.

**Chunk-based SRS, not word-based** — the learning unit is the full multi-word expression with its context. Closer to how fluency actually works.

---

## Getting Started (local dev)

```bash
git clone https://github.com/natsouzax/lexuri.git
cd lexuri
npm install
cp .env.local.example .env.local
# fill in your keys
npm run dev
```

**Required env vars:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `OPENAI_API_KEY` | OpenAI key |
| `GENIUS_API_KEY` | Genius.com lyrics API |
| `NEXT_PUBLIC_APP_URL` | Base URL, e.g. `http://localhost:3000` |

Stripe and Resend keys are optional for local dev (payments and email won't work without them).

**Database migrations** — run in order via Supabase CLI or SQL editor:

```
supabase/migrations/0001_flashcards.sql
supabase/migrations/0002_profiles.sql
supabase/migrations/0003_native_language.sql
supabase/migrations/0004_subscriptions.sql
supabase/migrations/0005_analytics.sql
supabase/migrations/0006_notifications.sql
supabase/migrations/0007_gamification.sql
```

After `0006`, enable Realtime on the `notifications` table in the Supabase dashboard.

---

## Tests

```bash
npm test               # run once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage
```

Covered: gamification scoring, Stripe webhook verification, analytics event validation.

---

## Partnerships

The source code is open for learning, reference, and transparency.

The platform at [lexuri.app](https://lexuri.app) is an independent product.

If you're interested in **collaborating, integrating, or partnering** — reach out:

**natanoliveiraad855@gmail.com**

---

## License

Copyright (c) 2026 Natan Oliveira — All rights reserved.

Source code is publicly visible for portfolio and transparency purposes. The platform, brand, and product are not open for redistribution or commercial use without written permission. Partnerships welcome — see above.
