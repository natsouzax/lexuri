'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const STEPS = [
  ['01', 'Open real content', 'Choose a YouTube video, song, podcast, or curated lesson.'],
  ['02', 'AI finds useful chunks', 'Lexuri detects idioms, phrasal verbs, collocations, and natural spoken patterns.'],
  ['03', 'Save what matters', 'Pick the chunks you actually want to use in speech and writing.'],
  ['04', 'Review before forgetting', 'Every saved chunk becomes a contextual SRS card with audio and examples.'],
]

function StepCard({ n, title, body, index }: { n: string; title: string; body: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <motion.div
      ref={ref}
      className="step-card"
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: EASE_OUT }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(57,47,29,0.12)' }}
    >
      <div className="step-number">{n}</div>
      <div>
        <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
          {body}
        </p>
      </div>
    </motion.div>
  )
}

export default function StepsSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const headInView = useInView(headRef, { once: true, margin: '-60px 0px' })

  return (
    <section className="mkt-section mkt-section-cream">
      <div className="mkt-container">
        <motion.div
          ref={headRef}
          style={{ textAlign: 'center', marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <span className="mkt-eyebrow">Activation loop</span>
          <h2 className="mkt-h2">The whole product is built around one loop.</h2>
          <p className="mkt-lead" style={{ margin: '0 auto' }}>
            Real content goes in. Useful chunks come out. Reviews turn them into long-term memory.
          </p>
        </motion.div>

        <div className="mkt-grid-4col">
          {STEPS.map(([n, title, body], i) => (
            <StepCard key={n} n={n} title={title} body={body} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
