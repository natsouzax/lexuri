import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verbly — Learn English from real content',
  description: 'AI-powered language learning. Turn videos, music, and transcripts into fluency — through chunks, not word lists.',
}

const FEATURES = [
  {
    icon: '▶',
    iconBg: 'rgba(70,98,74,0.15)',
    iconColor: '#46624a',
    title: 'Video + Transcript',
    body: 'Load any YouTube video. The transcript syncs word by word as you watch. Click to collect words in context.',
  },
  {
    icon: '◈',
    iconBg: 'rgba(200,111,74,0.12)',
    iconColor: '#c86f4a',
    title: 'Language Chunk Detection',
    body: 'AI identifies phrasal verbs, idioms, collocations, and formulaic sequences — the units your brain actually stores.',
  },
  {
    icon: '⊞',
    iconBg: 'rgba(74,144,226,0.12)',
    iconColor: '#4a90e2',
    title: 'Smart Flashcards',
    body: 'Every chunk becomes a flashcard with contextual translation, example, and explanation. No manual entry.',
  },
  {
    icon: '↻',
    iconBg: 'rgba(156,39,176,0.1)',
    iconColor: '#9c27b0',
    title: 'Spaced Repetition',
    body: 'The SM-2 algorithm shows you each card at exactly the right moment — right before you forget it.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Load real content',
    body: 'Paste a YouTube URL or search for a song. Verbly fetches the transcript automatically.',
  },
  {
    n: '02',
    title: 'AI detects the chunks',
    body: 'Instead of flagging random hard words, the AI identifies natural language units: phrasal verbs, idioms, collocations — exactly how English is stored in your brain.',
  },
  {
    n: '03',
    title: 'Review and retain',
    body: 'Chunks become flashcards. The spaced repetition system schedules each review at the optimal moment for long-term retention.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="mkt-section-dark" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="mkt-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div className="animate-fade-up">
            <span className="mkt-eyebrow">AI-Powered Language Learning</span>
            <h1 className="mkt-h1" style={{ color: 'var(--paper)' }}>
              Learn English from the content you already love.
            </h1>
            <p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 36 }}>
              Stop memorizing word lists. Verbly detects the natural language chunks in videos and music — the phrases, idioms, and patterns that build real fluency.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/youtube" className="btn-mkt-primary">Start learning free →</Link>
              <Link href="/features" className="btn-mkt-ghost">See how it works</Link>
            </div>
          </div>

          {/* Mockup */}
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="hero-mockup">
              <div className="hero-mockup-bar">
                <div className="hero-mockup-dot" style={{ background: '#ff5f57' }} />
                <div className="hero-mockup-dot" style={{ background: '#febc2e' }} />
                <div className="hero-mockup-dot" style={{ background: '#28c840' }} />
                <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--dark-muted)', fontWeight: 700 }}>Chunk Map</span>
              </div>
              <div style={{ padding: '20px 24px', lineHeight: 2.2, fontSize: '0.9rem', color: 'rgba(255,250,240,0.85)' }}>
                {'I\'ve been '}
                <span style={{ background: '#E91E6333', borderBottom: '2px solid #E91E63', padding: '1px 3px', borderRadius: 3 }}>kind of freaking out</span>
                {' lately, you know? I just '}
                <span style={{ background: '#4CAF5033', borderBottom: '2px solid #4CAF50', padding: '1px 3px', borderRadius: 3 }}>give up</span>
                {' trying to '}
                <span style={{ background: '#4A90E233', borderBottom: '2px solid #4A90E2', padding: '1px 3px', borderRadius: 3 }}>make sense of</span>
                {' it all. '}
                <span style={{ background: '#FF6B6B33', borderBottom: '2px solid #FF6B6B', padding: '1px 3px', borderRadius: 3 }}>At the end of the day</span>
                {' it\'s all about perspective.'}
              </div>
              <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Emotional', color: '#E91E63' },
                  { label: 'Phrasal Verb', color: '#4CAF50' },
                  { label: 'Collocation', color: '#4A90E2' },
                  { label: 'Idiom', color: '#FF6B6B' },
                ].map(({ label, color }) => (
                  <span key={label} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: color + '22', color }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="mkt-eyebrow">The Method</span>
            <h2 className="mkt-h2">Three steps to real fluency</h2>
            <p className="mkt-lead" style={{ margin: '0 auto' }}>
              No vocabulary lists. No grammar drills. Just language the way your brain was designed to learn it.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {STEPS.map((step, i) => (
              <div key={i} className="step-card animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="step-number">{step.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 8px' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why chunks beat words ─────────────────────────── */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">The Science</span>
            <h2 className="mkt-h2">Why word lists don&apos;t work</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 860, margin: '0 auto' }}>
            <div style={{ border: '1px solid rgba(200,80,60,0.25)', borderRadius: 20, padding: '28px 28px', background: 'rgba(200,80,60,0.05)' }}>
              <div style={{ fontWeight: 900, marginBottom: 16, fontSize: '0.85rem', color: '#b03020' }}>✕ Traditional approach</div>
              {['Memorize isolated words', 'No context or emotion', 'Forget within days', 'Can\'t speak naturally', 'Grammar rules, not patterns'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.88rem', color: 'var(--muted)' }}>
                  <span style={{ color: '#b03020', fontWeight: 900 }}>–</span> {t}
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid rgba(70,98,74,0.35)', borderRadius: 20, padding: '28px 28px', background: 'rgba(70,98,74,0.07)' }}>
              <div style={{ fontWeight: 900, marginBottom: 16, fontSize: '0.85rem', color: 'var(--moss)' }}>✓ Verbly approach</div>
              {['Learn in natural chunks', 'Real context from content you love', 'Spaced repetition for retention', 'Phrases ready to use', 'How the brain actually stores language'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: '0.88rem', color: 'var(--ink)' }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 900, flexShrink: 0 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────── */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="mkt-eyebrow">What&apos;s Inside</span>
            <h2 className="mkt-h2">Everything you need to reach fluency</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials placeholder ───────────────────────── */}
      <section className="mkt-section mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Learners</span>
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
            Real results from real learners
          </h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 48px' }}>
            Verbly is in early access. Testimonials coming soon.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {['B2 level in 6 months', 'Finally understood series without subtitles', 'Chunks made all the difference'].map((quote, i) => (
              <div key={i} style={{ border: '1px solid var(--dark-border)', borderRadius: 20, padding: '28px 24px', background: 'var(--dark-surface)', textAlign: 'left' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>✦</div>
                <p style={{ color: 'var(--dark-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div style={{ width: 48, height: 6, borderRadius: 99, background: 'var(--clay-bright)', opacity: 0.5 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="mkt-section" style={{ background: 'linear-gradient(135deg, var(--clay) 0%, #8B3A1E 100%)', color: '#fff' }}>
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow" style={{ color: 'rgba(255,250,240,0.7)' }}>Get Started</span>
          <h2 className="mkt-h2" style={{ color: '#fff', marginBottom: 16 }}>
            Start learning smarter today.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,250,240,0.75)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Verbly is free to start. No credit card. No downloads. Just open the app and load your first video.
          </p>
          <Link href="/youtube" className="btn-mkt-ghost" style={{ borderColor: 'rgba(255,250,240,0.5)', color: '#fff', fontSize: '1rem', padding: '15px 36px' }}>
            Open Verbly — it&apos;s free →
          </Link>
        </div>
      </section>
    </>
  )
}
