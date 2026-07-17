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

const ROADMAP = {
  done: [
    { title: 'YouTube Transcript Sync', body: 'Load any YouTube video, sync transcript word by word in real time.' },
    { title: 'AI Chunk Detection', body: 'Detect phrasal verbs, idioms, collocations, and formulaic sequences with exact character offsets.' },
    { title: 'Music Lab', body: 'Analyze song lyrics with chunk detection and contextual translations into your language.' },
    { title: 'AI Flashcard Generation', body: 'Instantly generate flashcards from words or chunks — no manual input.' },
    { title: 'Spaced Repetition Review', body: 'SM-2 algorithm schedules each flashcard at the optimal review moment.' },
    { title: 'User Accounts & Sync', body: 'Sign in with email, sync your deck and progress across all devices in real time.' },
    { title: 'Gamification & Leaderboard', body: 'XP system, 7 learner ranks (Seed → Native), daily streaks, milestone bonuses, and a live global leaderboard.' },
    { title: 'Progress Reports & Analytics', body: 'Retention rates, vocabulary growth charts, study pace, and streak history — all in your dashboard.' },
    { title: 'Native Language Translations', body: 'Pick your native language once. Hover any word, phrase, or chunk in any transcript and see an instant translation — across 12 languages.' },
    { title: 'Interactive Demo Lesson', body: 'A fully interactive demo on the marketing site — hover translations, chunk tooltips, and audio, no account needed.' },
  ],
  next: [
    { title: 'Mobile App', body: 'Review your flashcards on the go. iOS and Android, built with React Native.' },
    { title: 'Browser Extension', body: 'Detect chunks and save vocabulary directly from any webpage or video.' },
    { title: 'Podcast + Audio Mode', body: 'Import podcast transcripts and analyze them with the same chunk detection pipeline.' },
    { title: 'Offline Review Mode', body: 'Download your due cards and review without an internet connection — syncs back when you reconnect.' },
  ],
  planned: [
    { title: 'Netflix Learning Mode', body: 'Watch Netflix with chunk highlighting and one-click flashcard saving built into the subtitle track.' },
    { title: 'AI Tutor', body: 'Conversational AI practice that uses your saved vocabulary in context — like a tutor who knows your deck.' },
    { title: 'Pronunciation Feedback', body: 'Record yourself saying a chunk. Get feedback on stress, intonation, and connected speech.' },
    { title: 'Community Vocabulary Sets', body: 'Share and import curated chunk sets for shows, songs, and topics.' },
    { title: 'Language Challenges', body: 'Weekly challenges built around real content — compete with other learners using the same source material.' },
  ],
}

type StatusKey = 'done' | 'next' | 'planned'

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string; sectionClass: string; heading: string }> = {
  done:    { label: 'Live',        className: 'status-done',    sectionClass: 'mkt-section-cream', heading: 'Already shipped' },
  next:    { label: 'Up Next',     className: 'status-next',    sectionClass: 'mkt-section-sage',  heading: 'Coming next' },
  planned: { label: 'On the list', className: 'status-planned', sectionClass: 'mkt-section-cream', heading: 'On the horizon' },
}

function RoadmapSection({ status, items }: { status: StatusKey; items: { title: string; body: string }[] }) {
  const { label, className, sectionClass, heading } = STATUS_CONFIG[status]
  const headingRef = useRef<HTMLDivElement>(null)
  const headingInView = useInView(headingRef, { once: true, margin: '-60px 0px' })
  const gridRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(gridRef, { once: true, margin: '-60px 0px' })

  return (
    <section className={`mkt-section ${sectionClass}`}>
      <div className="mkt-container">
        <motion.div
          ref={headingRef}
          style={{ marginBottom: 36 }}
          initial={{ opacity: 0, y: 20 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className={`roadmap-status ${className}`}>{label}</span>
          <h2 className="mkt-h2" style={{ marginTop: 8 }}>{heading}</h2>
        </motion.div>

        <div className="roadmap-grid" ref={gridRef}>
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              animate={gridInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.06, ease: EASE_OUT }}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(24,33,29,0.1)' }}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 20,
                padding: '24px 24px',
                background: 'rgba(255,255,255,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span className={`roadmap-status ${className}`} style={{ marginBottom: 0 }}>
                  {label}
                </span>
              </div>
              <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function RoadmapContent() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })

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
            What&apos;s Coming
          </motion.span>
          <motion.h1
            className="mkt-h1"
            style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            The Lexuri roadmap.
          </motion.h1>
          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ margin: '0 auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
          >
            Here&apos;s what we&apos;ve shipped, what we&apos;re building next, and where we&apos;re headed.
          </motion.p>
        </div>
      </section>

      {(Object.entries(ROADMAP) as [StatusKey, typeof ROADMAP.done][]).map(([status, items]) => (
        <RoadmapSection key={status} status={status} items={items} />
      ))}

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <Reveal>
            <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
              Want to influence the roadmap?
            </h2>
            <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
              Tell us what features matter most to you. We read every message.
            </p>
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/contact" className="btn-mkt-primary">Send us feedback →</Link>
            </motion.div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
