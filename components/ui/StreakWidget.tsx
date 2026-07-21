'use client'

import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

interface Props {
  streak: number
  bestStreak?: number
  hasFreezeAvailable?: boolean
  freezeUsedToday?: boolean
}

export default function StreakWidget({ streak, bestStreak, hasFreezeAvailable, freezeUsedToday }: Props) {
  const isActive = streak > 0

  return (
    <div className="streak-widget">
      <div className="streak-top">
        <motion.div
          className="streak-flame"
          animate={isActive ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
        >
          {freezeUsedToday ? '🧊' : '🔥'}
        </motion.div>

        <div>
          <div className="streak-count-row">
            <motion.span
              className="streak-num"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.3 }}
            >
              {streak}
            </motion.span>
            <span className="streak-days">dias</span>
          </div>
          {(bestStreak ?? 0) > 0 && (
            <div className="streak-best">Recorde: {bestStreak} dias</div>
          )}
        </div>
      </div>

      {freezeUsedToday && (
        <motion.div
          className="streak-freeze-active"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5, ease: EASE_OUT }}
        >
          Streak protegido hoje
        </motion.div>
      )}

      {hasFreezeAvailable && !freezeUsedToday && (
        <div className="streak-freeze-hint">
          <SnowflakeIcon />
          <span>Freeze available</span>
        </div>
      )}
    </div>
  )
}

function SnowflakeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
