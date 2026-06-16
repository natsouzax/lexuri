import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features — Lexuri',
  description: 'Everything Lexuri can do — AI chunk detection, native-language translations, YouTube & music learning, flashcards, spaced repetition, gamification, and more.',
}

const FEATURES = [
  {
    icon: '◉',
    tag: 'Discovery',
    title: 'Learning Feed',
    body: 'A curated feed of TED talks, YouTube videos, and music — organised by CEFR difficulty level. Browse what the community is studying, save items to your queue, and jump straight into any content.',
    details: [
      'Filtered by level: A2, B1, B2, C1',
      'Videos and music in one unified feed',
      'Save to personal study queue',
      'Jump straight into YouTube Studio or Music Lab',
    ],
    color: '#d97b54',
    bg: 'rgba(200,111,74,0.08)',
  },
  {
    icon: '▶',
    tag: 'Video Learning',
    title: 'YouTube Transcripts',
    body: 'Paste any YouTube URL. Lexuri fetches the transcript and syncs it with the video word by word in real time. The active word highlights as you listen — your eyes and ears train together.',
    details: [
      'Real-time word-level sync with the video',
      'Adjustable caption delay calibration',
      'Click any word to instantly collect it',
      'Works with auto-generated and manual captions',
    ],
    color: '#46624a',
    bg: 'rgba(70,98,74,0.08)',
  },
  {
    icon: '♪',
    tag: 'Music Learning',
    title: 'Music Lab',
    body: 'Learn from song lyrics. Lexuri fetches the lyrics, runs the same AI chunk detection, and lets you save expressions straight from the music you already love. Context you actually enjoy.',
    details: [
      'Spotify search and direct song lookup',
      'Full AI chunk detection on lyrics',
      'Contextual translations into your native language',
      'Save any expression to your flashcard deck',
    ],
    color: '#9c27b0',
    bg: 'rgba(156,39,176,0.07)',
  },
  {
    icon: '◈',
    tag: 'AI Analysis',
    title: 'Language Chunk Detection',
    body: "Built on neuro-informed learning principles, Lexuri's AI detects the units your brain actually stores — not isolated words, but complete, reusable expressions. Every chunk comes with a contextual translation and a note on why it matters for real fluency.",
    details: [
      'Phrasal verbs ("give up", "freak out", "make sense of")',
      'Idiomatic expressions ("at the end of the day")',
      'Collocations ("make a decision", "break the ice")',
      'Formulaic sequences, grammar patterns, conversational chunks',
      'Multi-word phrase detection ("used to", "turns out")',
    ],
    color: '#c86f4a',
    bg: 'rgba(200,111,74,0.07)',
  },
  {
    icon: '🌍',
    tag: 'Personalisation',
    title: 'Native Language Translations',
    body: 'Tell Lexuri your native language once and every word, phrase, and chunk in the transcript shows a translation on hover — across the demo, YouTube, and Music Lab. 12 languages supported out of the box.',
    details: [
      'One-time language picker on first visit — auto-detects your browser language',
      'Hover any word in a transcript for an instant translation',
      'Hover any highlighted chunk for type, meaning, example, and audio',
      'Phrase-level detection: "used to", "turns out", "think about" and more',
      '12 languages: PT-BR, ES, FR, DE, IT, JA, KO, ZH, AR, TR, RU, HI',
    ],
    color: '#4a90e2',
    bg: 'rgba(74,144,226,0.07)',
  },
  {
    icon: '⊞',
    tag: 'Memory',
    title: 'AI Flashcards',
    body: 'Every word or chunk you collect becomes a rich flashcard automatically — with translation, plain-English explanation, and a natural example sentence from the original content. No manual typing.',
    details: [
      'Contextual + literal translations into your native language',
      'Plain-English explanation written for your level',
      'Example sentence from the original video or song',
      'Batch generation or one card at a time',
    ],
    color: '#ff9800',
    bg: 'rgba(255,152,0,0.07)',
  },
  {
    icon: '↻',
    tag: 'Retention',
    title: 'Spaced Repetition Review',
    body: 'The SM-2 algorithm tracks exactly when you\'re about to forget each card and surfaces it right at that moment. Rate your recall from 0 to 5. The system adapts per card — you stop wasting time on what you already know.',
    details: [
      'SM-2 spaced repetition algorithm',
      'Per-card ease factor and interval tracking',
      'Daily review queue shows only due cards',
      'Tracks vocabulary from both YouTube and music sources',
    ],
    color: '#607d8b',
    bg: 'rgba(96,125,139,0.08)',
  },
  {
    icon: '⚡',
    tag: 'Motivation',
    title: 'Gamification & Progress',
    body: 'Learning is a habit. Lexuri makes that habit sticky with XP, ranks, streaks, a live leaderboard, and detailed progress reports — so you always know how far you\'ve come and what to do next.',
    details: [
      'XP system with quality and speed multipliers',
      '7 ranks: Seed → Explorer → Speaker → Communicator → Storyteller → Fluent → Native',
      'Daily streak tracking with milestone bonuses (7, 14, 30 days)',
      'Global leaderboard vs. other learners',
      'Progress reports: retention rates, vocabulary growth, study pace',
    ],
    color: '#4caf50',
    bg: 'rgba(76,175,80,0.07)',
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">The Full Picture</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 700 }}>
            Everything Lexuri can do
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Eight interlocking systems — each one designed around how the brain actually acquires language.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((f, i) => (
        <section key={i} className={`mkt-section ${i % 2 === 0 ? 'mkt-section-cream' : 'mkt-section-sage'}`}>
          <div className="mkt-container">
            <div className={`mkt-feature-row${i % 2 !== 0 ? ' mkt-feature-row-reverse' : ''}`}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: f.bg, color: f.color }}>
                    {f.icon}
                  </div>
                  <span className="mkt-eyebrow" style={{ marginBottom: 0 }}>{f.tag}</span>
                </div>
                <h2 className="mkt-h2">{f.title}</h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: 24 }}>{f.body}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {f.details.map((d) => (
                    <li key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: '0.88rem', color: 'var(--ink)' }}>
                      <span style={{ color: f.color, fontWeight: 900, flexShrink: 0 }}>→</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ border: '1px solid var(--line)', borderRadius: 20, padding: 32, background: f.bg, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', color: f.color }}>
                    <div style={{ fontSize: '4rem', marginBottom: 12 }}>{f.icon}</div>
                    <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem' }}>{f.title}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Ready to try it?</h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
            Free to start. Use coupon <strong style={{ color: 'var(--clay-bright)' }}>LEARN</strong> for 1 month of Premium free.
          </p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="/demo" className="btn-mkt-primary">Try the demo lesson →</Link>
            <Link href="/plans#coupon" className="btn-mkt-ghost">Get 1 month free</Link>
          </div>
        </div>
      </section>
    </>
  )
}
