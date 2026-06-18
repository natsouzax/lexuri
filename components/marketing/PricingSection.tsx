'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const FREE_FEATURES = [
  'Demo lesson',
  '5 curated feed lessons',
  '5 YouTube imports/week',
  '5 music songs/week',
  'Spaced repetition review',
]

const PREMIUM_FEATURES = [
  'Unlimited YouTube & music imports',
  'Unlimited AI chunk detection',
  'Detailed progress reports',
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
              padding: '6px 14px', borderRadius: 999, letterSpacing: '0.08em',
            }}>
              2 WEEKS FREE
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
              margin: '20px 0',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(200,111,74,0.07)',
              border: '1.5px dashed var(--clay)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--clay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <div>
                  <center>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 1 }}>
                      Coupon
                    </div>
                  </center>
                  <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.08em', color: 'var(--ink)' }}>
                    LEARN
                  </div>
                </div>
              </div>
              <div style={{
                background: 'var(--clay)', color: '#fff',
                borderRadius: 10, padding: '8px 40px',
                fontSize: '0.72rem', fontWeight: 900,
                letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4,
              }}>
                2 WEEKS FREE
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
