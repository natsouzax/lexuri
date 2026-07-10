'use client'

import { motion } from 'framer-motion'
import type { OnboardingCopy } from '@/lib/onboarding-i18n'

interface WelcomeStepProps {
  copy: OnboardingCopy
}

export default function WelcomeStep({ copy }: WelcomeStepProps) {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        style={{ width: 88, height: 88, marginBottom: 24 }}
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 12px 32px rgba(200,111,74,0.28)',
              '0 16px 44px rgba(200,111,74,0.44)',
              '0 12px 32px rgba(200,111,74,0.28)',
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 22,
            background: '#FFFAF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '2.6rem', color: '#18211D' }}>L</span>
        </motion.div>
      </motion.div>

      <motion.h1
        className="onboard-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {copy.welcomeTitle}
      </motion.h1>

      <motion.p
        className="onboard-desc"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        style={{ maxWidth: 420 }}
      >
        {copy.welcomeSubtitle}
      </motion.p>
    </div>
  )
}
