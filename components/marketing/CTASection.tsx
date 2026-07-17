'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT, EASE_SPRING } from '@/lib/easing'

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <section
      className="mkt-section"
      style={{ background: 'linear-gradient(135deg, var(--clay) 0%, #8B3A1E 100%)', color: '#fff' }}
    >
      <div className="mkt-container" style={{ textAlign: 'center' }} ref={ref}>
        <motion.span
          className="mkt-eyebrow"
          style={{ color: 'rgba(255,250,240,0.72)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          First moment
        </motion.span>

        <motion.h2
          className="mkt-h2"
          style={{ color: '#fff', marginBottom: 16 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT }}
        >
          See your first AI chunk map in under a minute.
        </motion.h2>

        <motion.p
          style={{
            fontSize: '1.05rem', color: 'rgba(255,250,240,0.78)',
            maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.2, ease: EASE_OUT }}
        >
          No setup. No credit card. Open the demo, save three chunks, and complete your first review.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.32, ease: EASE_SPRING }}
          style={{ display: 'inline-block' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <Link
            href="/demo"
            className="btn-mkt-ghost"
            style={{
              borderColor: 'rgba(255,250,240,0.55)',
              color: '#fff',
              fontSize: '1rem',
              padding: '15px 36px',
            }}
          >
            Start the demo lesson
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
