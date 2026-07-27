'use client'

import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { FlameIcon, SnowflakeIcon } from '@/components/ui/Icons'

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
          {freezeUsedToday ? <SnowflakeIcon size={22} /> : <FlameIcon size={22} />}
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
          <SnowflakeIcon size={11} />
          <span>Freeze available</span>
        </div>
      )}
    </div>
  )
}
