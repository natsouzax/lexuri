'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

export default function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <section className="mkt-section mkt-section-sage">
      <div className="mkt-container">
        <div className="mkt-feature-row" ref={ref}>
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <span className="mkt-eyebrow">Why it works</span>
            <h2 className="mkt-h2">
              Words are too small. Chunks are what fluent speakers retrieve.
            </h2>
            <p className="mkt-lead">
              Learning &quot;make&quot; and &quot;sense&quot; separately does not prepare you for real English.
              Learning &quot;make sense of&quot; as one reusable unit does.
            </p>
          </motion.div>

          <motion.div
            className="mkt-comparison mkt-grid-2col"
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
          >
            <motion.div
              className="method-card method-card-bad"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <strong>Traditional apps</strong>
              <span>Isolated words</span>
              <span>No real context</span>
              <span>Activity without fluency</span>
            </motion.div>
            <motion.div
              className="method-card method-card-good"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <strong>Lexuri</strong>
              <span>Natural expressions</span>
              <span>Context from content you like</span>
              <span>Review tied to memory</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
