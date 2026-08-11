# Lexuri — learn English through music

MVP validating a simple hypothesis: **learning English by listening to songs you already love drives engagement and retention.**

The user listens to a song with synced lyrics, taps on unfamiliar words (instant translation), saves the ones they want to learn, and reviews them in short sessions over 3 days. In the end, their own learnings become "their song."

**Production:** [lexuri-validacao.vercel.app](https://lexuri-validacao.vercel.app)

> This is NOT a SaaS — it's a research prototype. No sales, no funnel, no premium tier. The goal is to validate the idea with real users and iterate from data.

---

## User flow

```
Sign up → choose level (1 click) → open a song
      ↓
Listen with synced lyrics (karaoke style)
      ↓
Tap words/chunks → translation → save to library
      ↓
3-day review cycle per song:
  Day 1 — Flashcards (SRS: flip the card, rate difficulty)
  Day 2 — Memory game (match word to translation)
  Day 3 — Complete the lyrics + "which 2 takeaways stuck with you?"
      ↓
Takeaways become part of the Glossary, every 2 takeaways generate a verse
      ↓
Verse by verse, the user composes their own song
```

## Album module

Besides standalone songs, learners can go through an entire concept album (e.g. American Idiot, Green Day) — completing the 3-day cycle for each track, then a global album cycle with a reflection on the theme, and in the end the verses from all tracks form "their track." Albums are organized into 3 tiers: beginner / intermediate / advanced.

## Key features

| Area | What it does |
| --- | --- |
| Synced player | Karaoke-style lyrics synced with the YouTube video |
| Tap-to-translate | Tap any word/chunk to get translation + meaning; saves as a flashcard |
| Chunk analysis (AI) | GPT detects idioms, phrasal verbs, collocations, etc. (dense, ~11-22 per 100 words), filterable by type |
| Spaced repetition (SM-2) | Flashcards resurface right before they'd be forgotten |
| D1/D2/D3 cycle | Three short sessions per song, with a 1-day lock between steps |
| Active glossary + verses | Only what the user writes enters the glossary; every 2 entries generate a verse |
| Floating translator | Floating bubble on any screen: type or select text to translate/listen/save |
| Gamification | XP, streaks, daily quests, badges, leaderboard |
| Immersion + i18n | UI 100% in English; the language chosen in the popup only translates content (lyrics, chunks, words). 13 native languages supported |

## Architecture

Content is static, progress is stored in the database. Lessons ("StaticLesson") are pre-generated TypeScript files in `data/featured-lessons/` — transcript, synced segments, and analyzed chunks. Loading a song performs no scraping or AI call. Runtime AI is limited to user-requested translation/definition, glossary and verse generation, and optional speech transcription.

Offline curation: synced lyrics come from lrclib.net (community LRC database) or YouTube captions; chunks are AI-generated. Everything runs through scripts in `scripts/`, outside of runtime.

Supabase stores account preferences, auditable legal consent, user-created learning data, progress, gamification, feedback, and optional final recordings. User-owned records use Row Level Security; administrative keys remain server-only.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.3 (App Router, React 19, TypeScript; Node 24) |
| Styling | Tailwind v4 + custom design system (globals.css) |
| Database + Auth | Supabase (Postgres + RLS + Auth) |
| AI | OpenAI — translation/definition, glossary generation, verses, and speech transcription |
| Synced lyrics | lrclib.net (offline curation) |
| Animations | Framer Motion |
| Deploy | Vercel |

## Running locally

```
npm install
npm run dev
```

App runs at `localhost:3000`. Requires a `.env.local` with the keys (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.

## Database

```
npm run db:migrate
```

Applies Supabase migrations in `supabase/migrations/`. Release-critical additions include 0031 (per-user API quotas), 0032 (Glossary practice), 0033 (legal consent/preferences), and 0034 (authenticated feedback).

## Curation scripts (non-runtime)

| Command | What it does |
| --- | --- |
| npm run check:albums | Analyzes feasibility of candidate albums (lrclib sync + density) |
| npm run gen:album | Generates lessons for an album's tracks via lrclib + chunks |
| npm run regen:chunks | Re-analyzes lesson chunks without touching the sync |
| npm run resync:batch3 | Re-syncs specific songs via lrclib |

## Deploy

```
npm run deploy
```

Runs tests, a production build, a production-dependency audit, and then `vercel --prod`. The app runs at lexuri-validacao. Details and rollback steps are in `_plans/deploy.md`; the beta operating checklist is in `_plans/beta-test-runbook.md`.

## Structure

```
app/
  (marketing)/   research landing + privacy/terms
  (auth)/        login, signup
  (app)/         dashboard, feed, level, music, review, library, albums, settings
  api/           flashcards, progress, takeaways, llm, gamification, albums
components/      player, chunks, review (D1/D2/D3), floating translator, ui
data/
  featured-lessons/  static lessons (StaticLesson)
  albums/            concept album metadata
lib/               chunks, srs, gamification, i18n, album, mvp, supabase
scripts/           lesson generation / re-sync (offline)
supabase/migrations/
_plans/            decisions, roadmap, deploy, album module
```

## Living documentation

The `_plans/` directory is the product's memory:
- `decisions.md` — architecture/product decision log
- `roadmap.md` — what's done and what's left
- `deploy.md` — how to ship it
- `beta-test-runbook.md` — release gate, smoke test, and cohort operation
- `beta-metrics.sql` — aggregate activation and retention funnel
- `album-module.md` — album module design

## License

Copyright © 2026 Natan Oliveira — all rights reserved. Code visible for portfolio and transparency purposes; not open source for redistribution.
