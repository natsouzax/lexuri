import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lexuri - Turn real content into English fluency',
  description: 'AI-powered English learning. Turn YouTube videos, songs, and transcripts into chunks, flashcards, and smart reviews.',
}

const CHUNKS = [
  {
    text: 'take it for granted',
    type: 'Collocation',
    meaning: 'to stop appreciating something because it feels normal',
    example: 'Many people take clean water for granted.',
    color: '#4A90E2',
  },
  {
    text: 'at the end of the day',
    type: 'Idiom',
    meaning: 'when everything important is considered',
    example: 'At the end of the day, consistency matters more than talent.',
    color: '#FF6B6B',
  },
  {
    text: 'make sense of',
    type: 'Phrasal verb',
    meaning: 'to understand something confusing',
    example: 'I watched the clip twice to make sense of the argument.',
    color: '#4CAF50',
  },
]

const STEPS = [
  ['01', 'Open real content', 'Choose a YouTube video, song, podcast, or curated lesson.'],
  ['02', 'AI finds useful chunks', 'Lexuri detects idioms, phrasal verbs, collocations, and natural spoken patterns.'],
  ['03', 'Save what matters', 'Pick the chunks you actually want to use in speech and writing.'],
  ['04', 'Review before forgetting', 'Every saved chunk becomes a contextual SRS card with audio and examples.'],
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    body: 'For feeling the Aha moment.',
    features: ['Demo lesson', '3 imports per month', '30 saved chunks', 'Basic review'],
  },
  {
    name: 'Pro',
    price: '$9/mo',
    body: 'For consistent learners.',
    features: ['More AI imports', 'Full chunk analysis', 'Smart SRS', 'Audio pronunciation', 'Progress reports'],
    featured: true,
  },
  {
    name: 'Premium',
    price: '$19/mo',
    body: 'For serious fluency goals.',
    features: ['Advanced learning tracks', 'Custom plans', 'Priority AI processing', 'Exports', 'Deep progress insights'],
  },
]

export default function HomePage() {
  return (
    <>
      <section className="mkt-section-dark mkt-hero-section">
        <div className="mkt-container mkt-redesign-hero">
          <div className="animate-fade-up">
            <span className="mkt-eyebrow">AI chunk-based English learning</span>
            <h1 className="mkt-h1" style={{ color: 'var(--paper)' }}>
              Turn any video into personalized English flashcards.
            </h1>
            <p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 30 }}>
              Lexuri finds the real expressions native speakers use, explains them in context, and schedules reviews before you forget them.
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

          <div className="aha-demo-card animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="aha-demo-header">
              <span>Demo lesson</span>
              <strong>18 chunks detected</strong>
            </div>
            <div className="aha-transcript">
              I used to <mark style={{ ['--chunk' as string]: '#4A90E2' }}>take it for granted</mark> that I could understand English, but <mark style={{ ['--chunk' as string]: '#FF6B6B' }}>at the end of the day</mark> I still could not <mark style={{ ['--chunk' as string]: '#4CAF50' }}>make sense of</mark> fast conversations.
            </div>
            <div className="aha-chunk-grid">
              {CHUNKS.map((chunk) => (
                <div key={chunk.text} className="aha-chunk-card" style={{ borderColor: `${chunk.color}66` }}>
                  <span style={{ color: chunk.color }}>{chunk.type}</span>
                  <h3>{chunk.text}</h3>
                  <p>{chunk.meaning}</p>
                  <small>{chunk.example}</small>
                </div>
              ))}
            </div>
          </div>
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
                Learning “make” and “sense” separately does not prepare you for real English. Learning “make sense of” as one reusable unit does.
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
            <h2 className="mkt-h2">Start free. Pay when Lexuri becomes your learning system.</h2>
          </div>
          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
                <span className="mkt-eyebrow">{plan.name}</span>
                <h3>{plan.price}</h3>
                <p>{plan.body}</p>
                <div>
                  {plan.features.map((feature) => <span key={feature}>{feature}</span>)}
                </div>
                <Link href={plan.name === 'Free' ? '/demo' : '/register'} className={plan.featured ? 'btn-mkt-primary' : 'btn-mkt-ghost'}>
                  {plan.name === 'Free' ? 'Try free' : 'Start with Pro'}
                </Link>
              </div>
            ))}
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
