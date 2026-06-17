'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const FREE_FEATURES = ['Demo lesson', '5 imports per week', '30 saved chunks', 'Basic review']

const PREMIUM_FEATURES = [
  'Unlimited YouTube & music imports',
  'Advanced AI chunk detection',
  'Automated SRS scheduling',
  'Progress reports & analytics',
  'Priority support',
  'Early access to new features',
]

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <section className="mkt-section mkt-section-cream">
      <div className="mkt-container">
        <motion.div
          ref={ref}
          style={{ textAlign: 'center', marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <span className="mkt-eyebrow">Pricing</span>
          <h2 className="mkt-h2">Start free. Go Premium when you&apos;re ready.</h2>
          <p className="mkt-lead" style={{ margin: '0 auto' }}>
            No pressure. The free plan is real — not a demo trap.
          </p>
        </motion.div>

        <div className="mkt-grid-2col" style={{ gap: 20, maxWidth: 780, margin: '0 auto' }}>
          {/* Free */}
          <motion.div
            className="pricing-card"
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT }}
            whileHover={{ y: -4, boxShadow: '0 20px 48px rgba(57,47,29,0.12)' }}
          >
            <span className="mkt-eyebrow">Free</span>
            <h3>$0</h3>
            <p>For feeling the Aha moment.</p>
            <div>
              {FREE_FEATURES.map((f) => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 900 }}>✓</span> {f}
                </span>
              ))}
            </div>
            <Link
              href="/demo"
              className="btn-mkt-ghost"
              style={{
                display: 'block', textAlign: 'center', marginTop: 'auto',
                border: '1.5px solid var(--line)', color: 'var(--ink)',
              }}
            >
              Try free
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            className="pricing-card featured"
            style={{ position: 'relative' }}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.2, ease: EASE_OUT }}
            whileHover={{ y: -4, boxShadow: '0 24px 56px rgba(200,111,74,0.22)' }}
          >
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
              {PREMIUM_FEATURES.map((f) => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--clay)', fontWeight: 900 }}>✓</span> {f}
                </span>
              ))}
            </div>

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

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/plans#coupon" className="btn-mkt-primary" style={{ display: 'block', textAlign: 'center' }}>
                Redeem coupon →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
