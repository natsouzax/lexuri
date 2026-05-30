import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything Verbly can do — video transcripts, AI chunk detection, smart flashcards, and spaced repetition.',
}

const FEATURES = [
  {
    icon: '▶',
    tag: 'Content Input',
    title: 'YouTube Transcripts',
    body: 'Paste any YouTube URL. Verbly fetches the transcript and syncs it with the video frame by frame. The active word highlights in real time as you listen, so your eyes and ears train together.',
    details: ['Auto-sync word highlighting', 'Adjustable caption delay calibration', 'Click any word to instantly collect it', 'Works with auto-generated and manual captions'],
    color: '#46624a',
    bg: 'rgba(70,98,74,0.08)',
  },
  {
    icon: '◈',
    tag: 'AI Analysis',
    title: 'Language Chunk Detection',
    body: 'Built with neuro-informed learning principles, Verbly\'s AI detects the units your brain actually stores — not isolated words, but complete expressions. Every chunk comes with a contextual Portuguese translation and a note on why it matters for fluency.',
    details: ['Phrasal verbs ("give up", "freak out")', 'Idiomatic expressions ("at the end of the day")', 'Collocations ("make a decision", "break the ice")', 'Formulaic sequences and conversational patterns'],
    color: '#c86f4a',
    bg: 'rgba(200,111,74,0.07)',
  },
  {
    icon: '⊞',
    tag: 'Memory',
    title: 'AI Flashcards',
    body: 'Every word or chunk you collect becomes a rich flashcard — with a translation, plain-English explanation, and a natural example sentence. No manual typing. The AI handles the card content automatically.',
    details: ['Contextual + literal Portuguese translations', 'English explanation in simple language', 'Example sentence from the original content', 'Batch generation or one at a time'],
    color: '#4a90e2',
    bg: 'rgba(74,144,226,0.08)',
  },
  {
    icon: '↻',
    tag: 'Retention',
    title: 'Spaced Repetition Review',
    body: 'The SM-2 algorithm tracks exactly when you\'re about to forget each card and shows it to you right at that moment. Rate your recall from 0 to 5. The system adapts its schedule per card — you stop wasting time on what you already know.',
    details: ['SM-2 spaced repetition algorithm', 'Per-card ease factor and interval tracking', 'Daily review queue shows only due cards', 'Tracks words from both YouTube and music sources'],
    color: '#9c27b0',
    bg: 'rgba(156,39,176,0.07)',
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
            Everything Verbly can do
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Four interlocking systems — each one designed around how the brain actually acquires language.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((f, i) => (
        <section key={i} className={`mkt-section ${i % 2 === 0 ? 'mkt-section-cream' : 'mkt-section-sage'}`}>
          <div className="mkt-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', direction: i % 2 === 0 ? 'ltr' : 'rtl' }}>
              <div style={{ direction: 'ltr' }}>
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
              <div style={{ direction: 'ltr' }}>
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
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>Free to start. No account required.</p>
          <Link href="/youtube" className="btn-mkt-primary">Open Verbly →</Link>
        </div>
      </section>
    </>
  )
}
