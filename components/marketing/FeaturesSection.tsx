'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const FEATURES = [
  {
    icon: '▶',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#3b82f6',
    eyebrow: 'YouTube Studio',
    title: 'Learn from any video',
    body: 'Paste a link and Lexuri maps every idiom, phrasal verb, and collocation in the transcript — synced to the exact second.',
    tags: ['Transcripts', 'Chunk detection', 'Audio sync'],
  },
  {
    icon: '♪',
    iconBg: 'rgba(139,92,246,0.12)',
    iconColor: '#8b5cf6',
    eyebrow: 'Music Lab',
    title: 'Learn from music you love',
    body: 'Turn your favorite songs into vocabulary lessons. Natural patterns from lyrics you already know and repeat.',
    tags: ['Song lyrics', 'Real English', 'Context-based'],
  },
  {
    icon: '↺',
    iconBg: 'rgba(70,98,74,0.14)',
    iconColor: 'var(--moss)',
    eyebrow: 'Smart SRS',
    title: 'Never forget what you learn',
    body: "Spaced repetition schedules your review at the last possible moment before you'd forget — permanently.",
    tags: ['Spaced repetition', 'Flashcards', 'Memory science'],
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <motion.div
      ref={ref}
      className="feature-card"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: EASE_OUT }}
      whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(57,47,29,0.14)' }}
    >
      <motion.div
        className="feature-icon"
        style={{ background: feature.iconBg, color: feature.iconColor, fontSize: '1.35rem' }}
        whileHover={{ scale: 1.12, rotate: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        {feature.icon}
      </motion.div>

      <div style={{ marginBottom: 6 }}>
        <span className="mkt-eyebrow" style={{ marginBottom: 6, color: feature.iconColor }}>
          {feature.eyebrow}
        </span>
        <h3 className="mkt-h3">{feature.title}</h3>
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: '0 0 18px' }}>
        {feature.body}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {feature.tags.map(tag => (
          <span
            key={tag}
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'var(--sage)',
              color: 'var(--moss)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function FeaturesSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const inView = useInView(headRef, { once: true, margin: '-60px 0px' })

  return (
    <section className="mkt-section mkt-section-cream">
      <div className="mkt-container">
        <motion.div
          ref={headRef}
          style={{ textAlign: 'center', marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <span className="mkt-eyebrow">Everything you need</span>
          <h2 className="mkt-h2">Three tools. One learning system.</h2>
          <p className="mkt-lead" style={{ margin: '0 auto' }}>
            YouTube, music, and smart review — all working together so you build fluency, not just vocabulary.
          </p>
        </motion.div>

        <div className="mkt-grid-3col">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.eyebrow} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
