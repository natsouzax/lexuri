'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, animate } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

function AnimatedCounter({ to, delay = 0.1 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctrls = animate(0, to, {
      duration: 0.75,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (el) el.textContent = String(Math.round(v)) },
    })
    return () => ctrls.stop()
  }, [to, delay])
  return <span ref={ref}>0</span>
}

interface Props {
  dueCount: number
  oldestAgo?: number
  loading?: boolean
}

export default function DueCardsHero({ dueCount, oldestAgo, loading }: Props) {
  const isUrgent = dueCount > 20

  if (loading) {
    return <div className="due-hero-skeleton" />
  }

  if (dueCount === 0) {
    return (
      <motion.div
        className="due-hero due-hero--empty"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } }}
        transition={{ duration: 0.15 }}
      >
        <span className="due-hero-check">
          <CheckIcon />
        </span>
        <div>
          <div className="due-hero-title">All caught up</div>
          <div className="due-hero-sub">Come back tomorrow or save new words.</div>
        </div>
        <motion.div style={{ marginLeft: 'auto' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href="/feed" className="btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
            Browse songs →
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`due-hero${isUrgent ? ' due-hero--urgent' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.15 }}
    >
      <div className="due-hero-count">
        <span className="due-hero-num">
          <AnimatedCounter to={dueCount} />
        </span>
        <span className="due-hero-unit">cards</span>
      </div>

      <div className="due-hero-body">
        <div className="due-hero-title">
          {isUrgent ? 'Many cards are due' : 'Due for review today'}
        </div>
        {(oldestAgo ?? 0) > 0 && (
          <div className="due-hero-sub">
            The oldest has waited {oldestAgo} {oldestAgo === 1 ? 'day' : 'days'}
          </div>
        )}
      </div>

      <motion.div style={{ marginLeft: 'auto', flexShrink: 0 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <Link href="/review" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
          Review now →
        </Link>
      </motion.div>
    </motion.div>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
