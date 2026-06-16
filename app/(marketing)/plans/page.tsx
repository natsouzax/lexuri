import type { Metadata } from 'next'
import Link from 'next/link'
import CouponSection from './CouponSection'
import CheckoutButton from '@/components/CheckoutButton'
import { isBrazil } from '@/lib/geo'

export const metadata: Metadata = {
  title: 'Plans — Lexuri',
  description: 'Lexuri is free to start. Go Premium to unlock unlimited content, advanced AI features, and faster progress. Use coupon LEARN for 1 month free.',
}

const FREE_FEATURES = [
  '5 YouTube videos per week',
  'Basic flashcard review',
  'Manual vocabulary saving',
  'Feed & community content',
]

const PREMIUM_FEATURES = [
  'Unlimited YouTube & music content',
  'Advanced AI chunk detection',
  'Automated SRS scheduling',
  'Detailed progress reports & analytics',
  'Priority support',
  'Early access to new features',
]

export default async function PlansPage() {
  const br = await isBrazil()
  const priceAmount = br ? 'R$25' : '$5'
  const pricePeriod = br ? '/ mês' : '/ month'
  const priceId = br
    ? (process.env.STRIPE_PRO_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Freemium</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 700 }}>
            Free to start.<br />Premium to go further.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 36px' }}>
            Lexuri&apos;s core is always free. Premium unlocks unlimited content and advanced AI
            for learners who want to move faster.
          </p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="#coupon" className="btn-mkt-primary">Get 1 month free →</Link>
            <Link href="/dashboard" className="btn-mkt-ghost">Explore the app</Link>
          </div>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">What you get</span>
            <h2 className="mkt-h2">Free vs Premium</h2>
          </div>
          <div className="mkt-grid-2col" style={{ gap: 20, alignItems: 'start' }}>
            {/* Free */}
            <div style={{ border: '1px solid var(--line)', borderRadius: 20, padding: '28px 32px', background: '#fff' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Free</div>
              <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '2rem', marginBottom: 4, color: 'var(--ink)' }}>$0</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Always free. No credit card.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FREE_FEATURES.map((f) => (
                  <li key={f} style={{ fontSize: '0.87rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 900, lineHeight: 1.5 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div style={{ border: '2px solid var(--clay)', borderRadius: 20, padding: '28px 32px', background: 'rgba(200,111,74,0.04)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -13, left: 24, background: 'var(--clay)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.06em' }}>
                PREMIUM
              </span>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 12 }}>Premium</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '2rem', color: 'var(--clay)' }}>{priceAmount}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{pricePeriod}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Everything in Free, plus:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} style={{ fontSize: '0.87rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--clay)', fontWeight: 900, lineHeight: 1.5 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <CheckoutButton priceId={priceId} label={`Assinar por ${priceAmount}${pricePeriod} →`} />
            </div>
          </div>
        </div>
      </section>

      {/* Coupon */}
      <section id="coupon" className="mkt-section mkt-section-sage">
        <div className="mkt-container" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">Validation period</span>
            <h2 className="mkt-h2">1 month of Premium, free.</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 480, margin: '12px auto 0' }}>
              You&apos;re among the first users of Lexuri. Unlock full Premium access for 1 month — no credit card required.
            </p>
          </div>
          <CouponSection />
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Ready to learn faster?</h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>Free gets you in. Premium gets you fluent.</p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="#coupon" className="btn-mkt-primary">Activate your free month →</Link>
            <Link href="/dashboard" className="btn-mkt-ghost">Continue with Free</Link>
          </div>
        </div>
      </section>
    </>
  )
}
