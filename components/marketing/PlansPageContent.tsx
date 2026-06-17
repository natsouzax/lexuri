'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT, EASE_SPRING } from '@/lib/easing'
import CouponSection from '@/components/marketing/CouponSection'
import CheckoutButton from '@/components/CheckoutButton'

function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
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

interface Props {
  priceAmount: string
  pricePeriod: string
  priceId: string
}

export default function PlansPageContent({ priceAmount, pricePeriod, priceId }: Props) {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const cardsRef = useRef<HTMLDivElement>(null)
  const cardsInView = useInView(cardsRef, { once: true, margin: '-60px 0px' })
  const couponHeadRef = useRef<HTMLDivElement>(null)
  const couponHeadInView = useInView(couponHeadRef, { once: true, margin: '-60px 0px' })

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }} ref={heroRef}>
          <motion.span
            className="mkt-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            Freemium
          </motion.span>
          <motion.h1
            className="mkt-h1"
            style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 700 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            Free to start.<br />Premium to go further.
          </motion.h1>
          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ margin: '0 auto 36px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
          >
            Lexuri&apos;s core is always free. Premium unlocks unlimited content and advanced AI
            for learners who want to move faster.
          </motion.p>
          <motion.div
            className="mkt-btn-group"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 16 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.36, ease: EASE_OUT }}
          >
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="#coupon" className="btn-mkt-primary">Get 1 month free →</Link>
            </motion.div>
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/dashboard" className="btn-mkt-ghost">Explore the app</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 860, margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">What you get</span>
            <h2 className="mkt-h2">Free vs Premium</h2>
          </Reveal>

          <div className="mkt-grid-2col" style={{ gap: 20, alignItems: 'start' }} ref={cardsRef}>
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={cardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              style={{ border: '1px solid var(--line)', borderRadius: 20, padding: '28px 32px', background: '#fff' }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Free</div>
              <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '2rem', marginBottom: 4, color: 'var(--ink)' }}>$0</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>Always free. No credit card.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FREE_FEATURES.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -10 }}
                    animate={cardsInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: EASE_OUT }}
                    style={{ fontSize: '0.87rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span style={{ fontWeight: 900, lineHeight: 1.5 }}>✓</span>{f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={cardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
              whileHover={{ y: -4, boxShadow: '0 24px 56px rgba(200,111,74,0.18)' }}
              style={{
                border: '2px solid var(--clay)',
                borderRadius: 20,
                padding: '28px 32px',
                background: 'rgba(200,111,74,0.04)',
                position: 'relative',
              }}
            >
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
                {PREMIUM_FEATURES.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -10 }}
                    animate={cardsInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.2 + i * 0.06, ease: EASE_OUT }}
                    style={{ fontSize: '0.87rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <span style={{ color: 'var(--clay)', fontWeight: 900, lineHeight: 1.5 }}>✓</span>{f}
                  </motion.li>
                ))}
              </ul>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: 24 }}
              >
                <CheckoutButton priceId={priceId} label={`Assinar por ${priceAmount}${pricePeriod} →`} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Coupon */}
      <section id="coupon" className="mkt-section mkt-section-sage">
        <div className="mkt-container" style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            ref={couponHeadRef}
            style={{ textAlign: 'center', marginBottom: 48 }}
            initial={{ opacity: 0, y: 24 }}
            animate={couponHeadInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <span className="mkt-eyebrow">Validation period</span>
            <h2 className="mkt-h2">1 month of Premium, free.</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 480, margin: '12px auto 0' }}>
              You&apos;re among the first users of Lexuri. Unlock full Premium access for 1 month — no credit card required.
            </p>
          </motion.div>
          <CouponSection />
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <Reveal>
            <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Ready to learn faster?</h2>
            <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>Free gets you in. Premium gets you fluent.</p>
            <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="#coupon" className="btn-mkt-primary">Activate your free month →</Link>
              </motion.div>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard" className="btn-mkt-ghost">Continue with Free</Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
