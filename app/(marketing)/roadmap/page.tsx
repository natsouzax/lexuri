import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'What\'s live, what\'s next, and what\'s planned for Lexuri — mobile app, browser extension, Netflix mode, AI tutor, and more.',
}

const ROADMAP = {
  done: [
    { title: 'YouTube Transcript Sync', body: 'Load any YouTube video, sync transcript word by word in real time.' },
    { title: 'AI Chunk Detection', body: 'Detect phrasal verbs, idioms, collocations, and formulaic sequences with exact character offsets.' },
    { title: 'Music Lab', body: 'Analyze song lyrics with chunk detection and contextual translations into your language.' },
    { title: 'AI Flashcard Generation', body: 'Instantly generate flashcards from words or chunks — no manual input.' },
    { title: 'Spaced Repetition Review', body: 'SM-2 algorithm schedules each flashcard at the optimal review moment.' },
  ],
  next: [
    { title: 'User Accounts', body: 'Sign in to sync your flashcards and progress across devices.' },
    { title: 'Mobile App', body: 'Review your flashcards on the go. iOS and Android, built with React Native.' },
    { title: 'Browser Extension', body: 'Detect chunks and save vocabulary directly from any webpage or video.' },
    { title: 'Progress Dashboard', body: 'Track retention rates, streaks, vocabulary growth, and learning pace over time.' },
  ],
  planned: [
    { title: 'Netflix Learning Mode', body: 'Watch Netflix with chunk highlighting and one-click flashcard saving built into the subtitle track.' },
    { title: 'AI Tutor', body: 'Conversational AI practice that uses your saved vocabulary in context — like a tutor who knows your deck.' },
    { title: 'Pronunciation Feedback', body: 'Record yourself saying a chunk. Get feedback on stress, intonation, and connected speech.' },
    { title: 'Community Vocabulary Sets', body: 'Share and import curated chunk sets for shows, songs, and topics.' },
    { title: 'Language Challenges', body: 'Weekly challenges built around real content — compete with other learners using the same source material.' },
    { title: 'Podcast + Audio Mode', body: 'Import podcast transcripts and analyze them with the same chunk detection pipeline.' },
  ],
}

type StatusKey = 'done' | 'next' | 'planned'

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string }> = {
  done:    { label: 'Live',        className: 'status-done'    },
  next:    { label: 'Up Next',     className: 'status-next'    },
  planned: { label: 'On the list', className: 'status-planned' },
}

export default function RoadmapPage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">What&apos;s Coming</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}>
            The Lexuri roadmap.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Here&apos;s what we&apos;ve shipped, what we&apos;re building next, and where we&apos;re headed.
          </p>
        </div>
      </section>

      {/* Roadmap columns */}
      {(Object.entries(ROADMAP) as [StatusKey, typeof ROADMAP.done][]).map(([status, items]) => {
        const { label, className } = STATUS_CONFIG[status]
        return (
          <section key={status} className={`mkt-section ${status === 'next' ? 'mkt-section-sage' : 'mkt-section-cream'}`}>
            <div className="mkt-container">
              <div style={{ marginBottom: 36 }}>
                <span className={`roadmap-status ${className}`}>{label}</span>
                <h2 className="mkt-h2" style={{ marginTop: 8 }}>
                  {status === 'done' && 'Already shipped'}
                  {status === 'next' && 'Coming next'}
                  {status === 'planned' && 'On the horizon'}
                </h2>
              </div>
              <div className="roadmap-grid">
                {items.map((item) => (
                  <div key={item.title} style={{ border: '1px solid var(--line)', borderRadius: 20, padding: '24px 24px', background: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <span className={`roadmap-status ${className}`} style={{ marginBottom: 0 }}>
                        {label}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 8px' }}>{item.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Want to influence the roadmap?</h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
            Tell us what features matter most to you. We read every message.
          </p>
          <Link href="/contact" className="btn-mkt-primary">Send us feedback →</Link>
        </div>
      </section>
    </>
  )
}
