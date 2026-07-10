'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { QUESTIONS, computeLevel } from '@/lib/placement-questions'
import DuoOption from '@/components/ui/DuoOption'
import type { OnboardingCopy } from '@/lib/onboarding-i18n'

interface LevelQuizStepProps {
  copy: OnboardingCopy
  onComplete: (level: string) => void
}

export default function LevelQuizStep({ copy, onComplete }: LevelQuizStepProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...answers]
    newAnswers[currentQ] = optionIndex
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 280)
    } else {
      setTimeout(() => onComplete(computeLevel(newAnswers)), 280)
    }
  }

  const progressPct = Math.round((currentQ / QUESTIONS.length) * 100)
  const q = QUESTIONS[currentQ]

  return (
    <div>
      <p className="onboard-desc" style={{ marginBottom: 8 }}>{copy.quizIntro}</p>

      <div style={{ height: 4, borderRadius: 999, background: 'var(--auth-border)', marginBottom: 24, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 999, background: 'var(--auth-primary)' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--auth-muted)', marginBottom: 10 }}>
        Level {q.level} · Question {currentQ + 1} of {QUESTIONS.length}
      </div>

      <motion.div
        key={q.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h2 className="onboard-title" style={{ fontSize: '1.4rem' }}>{q.question}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {q.options.map((opt, i) => (
            <DuoOption
              key={i}
              selected={answers[currentQ] === i}
              onSelect={() => handleAnswer(i)}
              label={opt}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
