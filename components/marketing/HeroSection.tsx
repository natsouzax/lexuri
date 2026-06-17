'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import HeroDemo from './HeroDemo'
import { EASE_OUT, EASE_SPRING } from '@/lib/easing'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE_OUT },
})

const PROOF_PILLS = ['No credit card', '60-second first lesson', 'YouTube + Music + SRS']

export default function HeroSection() {
  return (
    <section className="mkt-section-dark mkt-hero-section">
      <div className="mkt-container mkt-redesign-hero">
        {/* Copy side */}
        <div>
          <motion.span
            className="mkt-eyebrow"
            {...fadeUp(0.15)}
          >
            AI chunk-based English learning
          </motion.span>

          <motion.h1 className="mkt-h1" style={{ color: 'var(--paper)' }}>
            <motion.span
              style={{ display: 'block', marginBottom: '0.25em' }}
              {...fadeUp(0.28)}
            >
              Stop memorizing words.
            </motion.span>
            <motion.span
              style={{
                display: 'block',
                fontSize: '1.6rem',
                lineHeight: 1,
                margin: '0.1em 0',
                color: 'var(--clay-bright)',
              }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.42, ease: EASE_SPRING }}
            >
              →
            </motion.span>
            <motion.span
              style={{ display: 'block', marginTop: '0.25em' }}
              {...fadeUp(0.52)}
            >
              Start speaking English.
            </motion.span>
          </motion.h1>

          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ marginBottom: 30 }}
            {...fadeUp(0.64)}
          >
            Lexuri finds the real expressions native speakers actually use — from videos and music you already watch — and builds them into your memory before you forget.
          </motion.p>

          <motion.div className="mkt-btn-group" {...fadeUp(0.74)}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/demo" className="btn-mkt-primary">
                Try the demo lesson
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="btn-mkt-ghost">
                Create free account
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="mkt-proof-row"
            aria-label="Product proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            {PROOF_PILLS.map((pill, i) => (
              <motion.span
                key={pill}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.08, duration: 0.35 }}
              >
                {pill}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ marginTop: 18, fontSize: '0.75rem', color: 'rgba(255,250,240,0.45)' }}
          >
            Testing the beta?{' '}
            <Link
              href="/feedback"
              style={{ color: 'rgba(200,111,74,0.85)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Share your feedback →
            </Link>
          </motion.p>
        </div>

        {/* Demo card side */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          >
            <HeroDemo />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
