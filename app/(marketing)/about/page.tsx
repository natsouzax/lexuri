import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description: 'Why Lexuri exists, our learning philosophy, and the science behind chunk-based language acquisition.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Our Story</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}>
            Built for people who learn seriously.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Lexuri started from one frustration: why does traditional language learning feel so disconnected from real communication?
          </p>
        </div>
      </section>

      {/* Why it exists */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <span className="mkt-eyebrow">The Problem</span>
          <h2 className="mkt-h2">Why vocabulary apps fail</h2>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
            Most language apps teach you words. But native speakers don&apos;t think in words — they think in chunks. &ldquo;Freaking out.&rdquo; &ldquo;At the end of the day.&rdquo; &ldquo;Make a decision.&rdquo; These aren&apos;t just vocabulary; they&apos;re mental units that get retrieved as a single piece.
          </p>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
            When you learn &ldquo;freak&rdquo; and &ldquo;out&rdquo; separately, you still have to assemble them during conversation — too slow. When you learn &ldquo;freaking out&rdquo; as a unit, it fires instantly.
          </p>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85 }}>
            That&apos;s the gap Lexuri fills.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container">
          <div className="mkt-feature-row">
            <div>
              <span className="mkt-eyebrow">Mission</span>
              <h2 className="mkt-h2">Make real fluency accessible.</h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                We believe fluency isn&apos;t about how many words you know — it&apos;s about how automatically you can retrieve and use natural language patterns. Lexuri is designed to bridge that gap: from passive exposure to active, automatic use.
              </p>
            </div>
            <div className="mkt-grid-2col">
              {[
                { label: 'Chunk-first', body: 'Language units, not isolated words.' },
                { label: 'Context-driven', body: 'Learning from content you already love.' },
                { label: 'Science-backed', body: 'Spaced repetition + neuro-informed design.' },
                { label: 'Learner-focused', body: 'Built for serious, self-directed people.' },
              ].map(({ label, body }) => (
                <div key={label} style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 20, background: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, marginBottom: 6, fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <span className="mkt-eyebrow">Learning Philosophy</span>
          <h2 className="mkt-h2">How we think about language</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 32 }}>
            {[
              {
                title: 'The brain stores language in chunks',
                body: 'Cognitive linguists and neurolinguists have established that fluent speakers store and retrieve multi-word sequences as single units. Lexuri\'s AI is designed to surface exactly these units — not isolated vocabulary.',
              },
              {
                title: 'Emotion and context accelerate retention',
                body: 'Words learned in isolation decay quickly. Words encountered while watching a scene you enjoyed, or while listening to a song that moved you, attach to episodic memory — dramatically increasing long-term recall.',
              },
              {
                title: 'Repetition must be spaced, not massed',
                body: 'Reviewing 100 cards the night before a test is the worst strategy. The spacing effect — reviewing at increasing intervals — is the most robust finding in cognitive psychology. Lexuri\'s review system is built around this.',
              },
            ].map(({ title, body }) => (
              <div key={title} style={{ borderLeft: '3px solid var(--clay)', paddingLeft: 24 }}>
                <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Try the approach yourself.</h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>Free. No signup required to explore.</p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="/youtube" className="btn-mkt-primary">Open the app →</Link>
            <Link href="/features" className="btn-mkt-ghost">See all features</Link>
          </div>
        </div>
      </section>
    </>
  )
}
