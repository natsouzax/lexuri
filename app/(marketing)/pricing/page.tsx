import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free. Upgrade when you\'re ready. Simple, transparent pricing for serious English learners.',
}

const FREE_FEATURES = [
  'Up to 10 videos per month',
  'Music Lab (unlimited songs)',
  'AI chunk detection',
  'Up to 100 flashcards',
  'Spaced repetition review',
  'Standard AI model',
]

const PRO_FEATURES = [
  'Unlimited videos',
  'Unlimited flashcards',
  'Priority AI (GPT-4o)',
  'Chunk analysis on all content',
  'Export flashcards (CSV / Anki)',
  'Early access to new features',
  'Email support',
]

const FAQS = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. The free plan requires no payment information. Just open the app and start learning.',
  },
  {
    q: 'What happens when I hit the free limits?',
    a: 'You keep all your existing flashcards and can continue reviewing them. You just can\'t add new videos until the next month or you upgrade.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, Pro is month-to-month. Cancel any time and keep your data.',
  },
  {
    q: 'Is there a student discount?',
    a: 'We\'re building something for learners first. Reach out via the contact page and we\'ll work something out.',
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Pricing</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 620 }}>
            Simple, transparent pricing.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Start free. Upgrade when Verbly becomes part of your daily routine.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card">
              <div className="pricing-tier">Free</div>
              <div className="pricing-price">$0</div>
              <div className="pricing-period">forever</div>
              <hr className="pricing-divider" />
              {FREE_FEATURES.map((f) => (
                <div key={f} className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
              <div className="pricing-cta">
                <Link href="/youtube" className="btn-mkt-dark" style={{ width: '100%', justifyContent: 'center' }}>
                  Start free →
                </Link>
              </div>
            </div>

            {/* Pro */}
            <div className="pricing-card pricing-card-pro">
              <span className="pricing-badge">Most popular</span>
              <div className="pricing-tier">Pro</div>
              <div className="pricing-price">$9</div>
              <div className="pricing-period">per month, billed monthly</div>
              <hr className="pricing-divider" />
              {PRO_FEATURES.map((f) => (
                <div key={f} className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
              <div className="pricing-cta">
                <Link href="/contact" className="btn-mkt-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Get Pro →
                </Link>
              </div>
            </div>

            {/* Team */}
            <div className="pricing-card" style={{ opacity: 0.7 }}>
              <div className="pricing-tier" style={{ color: 'var(--muted)' }}>Team</div>
              <div className="pricing-price" style={{ fontSize: '2.2rem', color: 'var(--muted)' }}>Coming soon</div>
              <div className="pricing-period">for schools &amp; groups</div>
              <hr className="pricing-divider" />
              {['Everything in Pro', 'Team dashboard', 'Shared vocabulary sets', 'Progress tracking per learner', 'Bulk seat pricing'].map((f) => (
                <div key={f} className="pricing-feature" style={{ color: 'var(--muted)' }}>
                  <span className="pricing-check" style={{ color: 'var(--muted)' }}>○</span>
                  <span>{f}</span>
                </div>
              ))}
              <div className="pricing-cta">
                <Link href="/contact" className="btn-mkt-dark" style={{ width: '100%', justifyContent: 'center', opacity: 0.6 }}>
                  Notify me
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">FAQ</span>
            <h2 className="mkt-h2">Common questions</h2>
          </div>
          {FAQS.map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-question">
                {item.q}
                <span style={{ fontSize: '1.2rem', color: 'var(--muted)', flexShrink: 0 }}>+</span>
              </div>
              <div className="faq-answer">{item.a}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
