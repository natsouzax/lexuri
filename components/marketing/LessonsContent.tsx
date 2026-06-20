'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { getThumbnail, getLevelColor } from '@/lib/feed'
import type { FeedItem } from '@/lib/feed'

function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

const LEVEL_LABELS: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1']

function LessonCard({ item, i }: { item: FeedItem; i: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })

  return (
    <motion.a
      ref={ref}
      href={`/lessons/${item.id}`}
      className="lesson-card"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: i * 0.07, ease: EASE_OUT }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getThumbnail(item.youtube_id)}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {item.type === 'music' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(90,20,120,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span
              style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              ♪
            </motion.span>
          </div>
        )}
        <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>
          {item.duration}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
          {item.channel ?? item.artist}
        </div>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: 6 }}>
          {item.title}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.preview}
        </p>
      </div>
    </motion.a>
  )
}

export default function LessonsContent({ items }: { items: FeedItem[] }) {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })

  const byLevel = LEVEL_ORDER.map((level) => ({
    level,
    items: items.filter((item) => item.level === level),
  })).filter((g) => g.items.length > 0)

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
            Featured Lessons
          </motion.span>
          <motion.h1
            className="mkt-h1"
            style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            Learn from music and videos you'll actually enjoy
          </motion.h1>
          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ margin: '0 auto 32px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
          >
            Hand-picked content with AI-detected phrasal verbs, idioms, collocations and grammar patterns — all highlighted directly in the transcript.
          </motion.p>
          <motion.div
            className="mkt-btn-group"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 16 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT }}
          >
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="btn-mkt-primary">Start for free →</Link>
            </motion.div>
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/demo" className="btn-mkt-ghost">Try a demo lesson</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Level sections */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          {byLevel.map(({ level, items: levelItems }, gi) => (
            <div key={level} style={{ marginBottom: gi < byLevel.length - 1 ? 52 : 0 }}>
              <Reveal delay={0.05}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <motion.span
                    style={{
                      background: getLevelColor(level),
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '3px 12px',
                      borderRadius: 999,
                      letterSpacing: '0.06em',
                    }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {level}
                  </motion.span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
                    {LEVEL_LABELS[level] ?? level}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                    {levelItems.length} {levelItems.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>
              </Reveal>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {levelItems.map((item, i) => (
                  <LessonCard key={item.id} item={item} i={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <Reveal>
            <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
              Ready to start learning?
            </h2>
            <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
              Free to start. Use coupon <strong style={{ color: 'var(--clay-bright)' }}>LEARN</strong> for 2 weeks of Premium free.
            </p>
            <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className="btn-mkt-primary">Create free account →</Link>
              </motion.div>
              <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/plans#coupon" className="btn-mkt-ghost">Get 2 weeks free</Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
