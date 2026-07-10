'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LEVEL_COLORS } from '@/lib/cefr'
import type { OnboardingCopy } from '@/lib/onboarding-i18n'
import { playFanfare } from '@/lib/sfx'
import ConfettiBurst from '@/components/ui/ConfettiBurst'

interface LevelRevealStepProps {
  level: string
  copy: OnboardingCopy
}

export default function LevelRevealStep({ level, copy }: LevelRevealStepProps) {
  const color = LEVEL_COLORS[level] ?? 'var(--auth-primary)'
  const description = copy.levelDescriptions[level]

  useEffect(() => {
    playFanfare()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <ConfettiBurst />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 900,
            fontSize: '5rem',
            color,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          {level}
        </motion.div>
      </div>
      <motion.h1
        className="onboard-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        Your English level
      </motion.h1>
      <motion.p
        className="onboard-desc"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        style={{ maxWidth: 380 }}
      >
        {description}
      </motion.p>
    </div>
  )
}
