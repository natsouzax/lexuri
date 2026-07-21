'use client'

import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import type { Mission } from '@/lib/gamification'

interface MissionProgress extends Mission {
  progress: number
  completed: boolean
}

interface Props {
  missions: MissionProgress[]
  loading?: boolean
}

export default function DailyMissions({ missions, loading }: Props) {
  if (loading) {
    return (
      <div className="panel daily-missions">
        <span className="mini-label" style={{ marginBottom: 14, display: 'block' }}>Daily missions</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="dm-skeleton" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    )
  }

  if (missions.length === 0) return null

  const allDone = missions.every((m) => m.completed)

  return (
    <div className="panel daily-missions">
      <div className="dm-header">
        <span className="mini-label">Daily missions</span>
        {allDone && (
          <motion.span
            className="dm-complete-tag"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            ✦ Completas
          </motion.span>
        )}
      </div>

      {allDone ? (
        <motion.div
          className="dm-all-done"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <span className="dm-all-done-title">Missions complete!</span>
          <span className="dm-all-done-sub">Come back tomorrow for new ones.</span>
        </motion.div>
      ) : (
        <div className="dm-list">
          {missions.map((m, i) => {
            const pct = Math.min(100, Math.round((m.progress / m.targetCount) * 100))
            return (
              <motion.div
                key={m.id}
                className={`dm-row${m.completed ? ' dm-row--done' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.07, ease: EASE_OUT }}
              >
                <span className="dm-icon">{m.icon}</span>
                <div className="dm-body">
                  <div className="dm-label">{m.description}</div>
                  <div className="dm-progress-row">
                    <div className="dm-bar">
                      <motion.div
                        className="dm-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.65, delay: 0.3 + i * 0.08, ease: EASE_OUT }}
                        style={{ background: m.completed ? 'var(--moss)' : 'var(--clay)' }}
                      />
                    </div>
                    <span className="dm-progress-txt" style={{ color: m.completed ? 'var(--moss)' : 'var(--muted)' }}>
                      {m.progress}/{m.targetCount}
                    </span>
                  </div>
                </div>
                <div className="dm-reward">
                  {m.completed ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.4 + i * 0.08 }}
                    >
                      <CheckCircleIcon />
                    </motion.div>
                  ) : (
                    <span className="dm-xp">+{m.xpReward} XP</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
