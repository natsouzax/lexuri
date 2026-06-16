import type { Metadata } from 'next'
import Link from 'next/link'
import HeroDemo from '@/components/marketing/HeroDemo'

export const metadata: Metadata = {
  title: 'Lexuri - Turn real content into English fluency',
  description: 'AI-powered English learning. Turn YouTube videos, songs, and transcripts into chunks, flashcards, and smart reviews.',
}

const STEPS = [
  ['01', 'Open real content', 'Choose a YouTube video, song, podcast, or curated lesson.'],
  ['02', 'AI finds useful chunks', 'Lexuri detects idioms, phrasal verbs, collocations, and natural spoken patterns.'],
  ['03', 'Save what matters', 'Pick the chunks you actually want to use in speech and writing.'],
  ['04', 'Review before forgetting', 'Every saved chunk becomes a contextual SRS card with audio and examples.'],
]

const FREE_FEATURES = ['Demo lesson', '5 imports per week', '30 saved chunks', 'Basic review']

const PREMIUM_FEATURES = [
  'Unlimited YouTube & music imports',
  'Advanced AI chunk detection',
  'Automated SRS scheduling',
  'Progress reports & analytics',
  'Priority support',
  'Early access to new features',
]

export default function HomePage() {
  return (
    <>
      <section className="mkt-section-dark mkt-hero-section">
        <div className="mkt-container mkt-redesign-hero">
          <div className="animate-fade-up">
            <span className="mkt-eyebrow">AI chunk-based English learning</span>
            <h1 className="mkt-h1" style={{ color: 'var(--paper)' }}>
              <span style={{ display: 'block', marginBottom: '0.25em' }}>Stop memorizing words.</span>
              <span style={{ display: 'block', fontSize: '1.6rem', lineHeight: 1, margin: '0.1em 0', color: 'var(--clay-bright)' }}>→</span>
              <span style={{ display: 'block', marginTop: '0.25em' }}>Start speaking English.</span>
            </h1>
            <p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 30 }}>
              Lexuri finds the real expressions native speakers actually use — from videos and music you already watch — and builds them into your memory before you forget.
            </p>
            <div className="mkt-btn-group">
              <Link href="/demo" className="btn-mkt-primary">Try the demo lesson</Link>
              <Link href="/register" className="btn-mkt-ghost">Create free account</Link>
            </div>
            <div className="mkt-proof-row" aria-label="Product proof">
              <span>No credit card</span>
              <span>60-second first lesson</span>
              <span>YouTube + Music + SRS</span>
            </div>
          </div>

          <HeroDemo />
        </div>
      </section>

      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">Activation loop</span>
            <h2 className="mkt-h2">The whole product is built around one loop.</h2>
            <p className="mkt-lead" style={{ margin: '0 auto' }}>
              Real content goes in. Useful chunks come out. Reviews turn them into long-term memory.
            </p>
          </div>
          <div className="mkt-grid-4col">
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="step-card">
                <div className="step-number">{n}</div>
                <div>
                  <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 8px' }}>{title}</h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container">
          <div className="mkt-feature-row">
            <div>
              <span className="mkt-eyebrow">Why it works</span>
              <h2 className="mkt-h2">Words are too small. Chunks are what fluent speakers retrieve.</h2>
              <p className="mkt-lead">
                Learning &quot;make&quot; and &quot;sense&quot; separately does not prepare you for real English. Learning &quot;make sense of&quot; as one reusable unit does.
              </p>
            </div>
            <div className="mkt-comparison mkt-grid-2col">
              <div className="method-card method-card-bad">
                <strong>Traditional apps</strong>
                <span>Isolated words</span>
                <span>No real context</span>
                <span>Activity without fluency</span>
              </div>
              <div className="method-card method-card-good">
                <strong>Lexuri</strong>
                <span>Natural expressions</span>
                <span>Context from content you like</span>
                <span>Review tied to memory</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">Pricing</span>
            <h2 className="mkt-h2">Start free. Go Premium when you&apos;re ready.</h2>
            <p className="mkt-lead" style={{ margin: '0 auto' }}>
              No pressure. The free plan is real — not a demo trap.
            </p>
          </div>

          <div className="mkt-grid-2col" style={{ gap: 20, maxWidth: 780, margin: '0 auto' }}>
            {/* Free */}
            <div className="pricing-card">
              <span className="mkt-eyebrow">Free</span>
              <h3>$0</h3>
              <p>For feeling the Aha moment.</p>
              <div>
                {FREE_FEATURES.map((f) => <span key={f}>{f}</span>)}
              </div>
              <Link href="/demo" className="btn-mkt-ghost" style={{ display: 'block', textAlign: 'center', marginTop: 'auto' }}>
                Try free
              </Link>
            </div>

            {/* Premium with coupon highlight */}
            <div className="pricing-card featured" style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', top: -13, left: 24,
                background: 'var(--clay)', color: '#fff',
                fontSize: '0.7rem', fontWeight: 900,
                padding: '4px 14px', borderRadius: 999, letterSpacing: '0.08em',
              }}>
                1 MONTH FREE
              </span>
              <span className="mkt-eyebrow" style={{ color: 'var(--clay-bright)' }}>Premium</span>
              <h3>$5<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}>/mo</span></h3>
              <p>For serious learners who want it all.</p>
              <div>
                {PREMIUM_FEATURES.map((f) => <span key={f}>{f}</span>)}
              </div>

              {/* Coupon offer */}
              <div style={{
                margin: '16px 0',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(200,111,74,0.08)',
                border: '1.5px dashed var(--clay)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 2 }}>
                    Validation coupon
                  </div>
                  <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.06em', color: 'var(--ink)' }}>
                    LEARN
                  </div>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textAlign: 'right', lineHeight: 1.4 }}>
                  1 month<br />free
                </div>
              </div>

              <Link href="/plans#coupon" className="btn-mkt-primary" style={{ display: 'block', textAlign: 'center' }}>
                Redeem coupon →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ background: 'linear-gradient(135deg, var(--clay) 0%, #8B3A1E 100%)', color: '#fff' }}>
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow" style={{ color: 'rgba(255,250,240,0.72)' }}>First moment</span>
          <h2 className="mkt-h2" style={{ color: '#fff', marginBottom: 16 }}>
            See your first AI chunk map in under a minute.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,250,240,0.78)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
            No setup. No credit card. Open the demo, save three chunks, and complete your first review.
          </p>
          <Link href="/demo" className="btn-mkt-ghost" style={{ borderColor: 'rgba(255,250,240,0.55)', color: '#fff', fontSize: '1rem', padding: '15px 36px' }}>
            Start the demo lesson
          </Link>
        </div>
      </section>
    </>
  )
}
