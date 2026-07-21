'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

function Reveal({
  children,
  delay = 0,
  x = 0,
  className,
  style,
}: {
  children: React.ReactNode
  delay?: number
  x?: number
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
      initial={{ opacity: 0, y: x === 0 ? 24 : 0, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

const PILLARS = [
  { label: 'Chunk-first', body: 'Language units, not isolated words.' },
  { label: 'Context-driven', body: 'Learning from content you already love.' },
  { label: 'Science-backed', body: 'Spaced repetition + neuro-informed design.' },
  { label: 'Learner-focused', body: 'Built for serious, self-directed people.' },
]

const PHILOSOPHY = [
  {
    title: 'The brain stores language in chunks',
    body: "Cognitive linguists and neurolinguists have established that fluent speakers store and retrieve multi-word sequences as single units. Lexuri's AI is designed to surface exactly these units — not isolated vocabulary.",
  },
  {
    title: 'Emotion and context accelerate retention',
    body: 'Words learned in isolation decay quickly. Words encountered while watching a scene you enjoyed, or while listening to a song that moved you, attach to episodic memory — dramatically increasing long-term recall.',
  },
  {
    title: 'Repetition must be spaced, not massed',
    body: "Reviewing 100 cards the night before a test is the worst strategy. The spacing effect — reviewing at increasing intervals — is the most robust finding in cognitive psychology. Lexuri's review system is built around this.",
  },
]

export default function AboutContent() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const pillarsRef = useRef<HTMLDivElement>(null)
  const pillarsInView = useInView(pillarsRef, { once: true, margin: '-60px 0px' })
  const philoRef = useRef<HTMLDivElement>(null)
  const philoInView = useInView(philoRef, { once: true, margin: '-60px 0px' })

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
            Our Story
          </motion.span>
          <motion.h1
            className="mkt-h1"
            style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            Built for people who learn seriously.
          </motion.h1>
          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ margin: '0 auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
          >
            Lexuri started from one frustration: why does traditional language learning feel so disconnected from real communication?
          </motion.p>
        </div>
      </section>

      {/* The Name */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <span className="mkt-eyebrow">The Name</span>
            <h2 className="mkt-h2">Why Lexuri?</h2>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85 }}>
              <strong style={{ color: 'var(--ink)' }}>Lexuri</strong> comes from the Portuguese roots{' '}
              <em>lecionar</em> (to teach) and <em>aprender</em> (to learn). The name captures both sides of the
              language journey — input and output, exposure and retention. It&apos;s a reminder that real fluency is
              not passive: you have to encounter language, process it, and eventually produce it yourself.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Why it exists */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <span className="mkt-eyebrow">The Problem</span>
            <h2 className="mkt-h2">Why vocabulary apps fail</h2>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
              Most language apps teach you words. But native speakers don&apos;t think in words — they think in
              chunks. &ldquo;Freaking out.&rdquo; &ldquo;At the end of the day.&rdquo; &ldquo;Make a
              decision.&rdquo; These aren&apos;t just vocabulary; they&apos;re mental units that get retrieved as a
              single piece.
            </p>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
              When you learn &ldquo;freak&rdquo; and &ldquo;out&rdquo; separately, you still have to assemble them
              during conversation — too slow. When you learn &ldquo;freaking out&rdquo; as a unit, it fires
              instantly.
            </p>
            <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85 }}>
              That&apos;s the gap Lexuri fills.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div className="mkt-feature-row">
            <Reveal x={-32}>
              <span className="mkt-eyebrow">Mission</span>
              <h2 className="mkt-h2">Make real fluency accessible.</h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                We believe fluency isn&apos;t about how many words you know — it&apos;s about how automatically you
                can retrieve and use natural language patterns. Lexuri is designed to bridge that gap: from passive
                exposure to active, automatic use.
              </p>
            </Reveal>
            <div className="mkt-grid-2col" ref={pillarsRef}>
              {PILLARS.map(({ label, body }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={pillarsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
                  whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(24,33,29,0.1)' }}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 20,
                    background: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, marginBottom: 6, fontSize: '0.95rem' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>{body}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <span className="mkt-eyebrow">Learning Philosophy</span>
            <h2 className="mkt-h2">How we think about language</h2>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 32 }} ref={philoRef}>
            {PHILOSOPHY.map(({ title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -24 }}
                animate={philoInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12, ease: EASE_OUT }}
                style={{ borderLeft: '3px solid var(--clay)', paddingLeft: 24 }}
              >
                <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 8px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <Reveal>
            <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
              Try the approach yourself.
            </h2>
            <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
              Free. No signup required to explore.
            </p>
            <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/feed" className="btn-mkt-primary">Open the app →</Link>
              </motion.div>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/features" className="btn-mkt-ghost">See all features</Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
