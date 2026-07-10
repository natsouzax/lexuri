'use client'

import { useEffect, useState } from 'react'
import { motion, animate, AnimatePresence } from 'framer-motion'
import StreakWidget from '@/components/ui/StreakWidget'
import type { OnboardingCopy } from '@/lib/onboarding-i18n'
import { playTap, playSelect, playSuccess, playSoft } from '@/lib/sfx'

interface GuidedPracticeStepProps {
  copy: OnboardingCopy
}

type Phase = 'read' | 'clicked' | 'reviewing' | 'rated'

const CHUNK_TEXT = 'By the way'
const SENTENCE_AFTER = ", I tried to say what I really meant."
const CHUNK_EXPLANATION = 'Used to casually introduce a related thought — very common in spoken English.'
const CHUNK_EXAMPLE = "By the way, I tried to say what I really meant."

const RATINGS = [
  { label: 'Again', n: 0, bg: 'rgba(192,57,43,0.1)', color: '#c0392b', border: 'rgba(192,57,43,0.35)' },
  { label: 'Hard', n: 1, bg: 'rgba(200,111,74,0.1)', color: '#c86f4a', border: 'rgba(200,111,74,0.35)' },
  { label: 'Good', n: 3, bg: 'rgba(39,174,96,0.1)', color: '#27ae60', border: 'rgba(39,174,96,0.3)' },
  { label: 'Easy', n: 5, bg: 'rgba(17,122,101,0.12)', color: '#117a65', border: 'rgba(17,122,101,0.3)' },
]

function xpFor(quality: number): number {
  if (quality >= 4) return 15
  if (quality >= 3) return 10
  return 3
}

export default function GuidedPracticeStep({ copy }: GuidedPracticeStepProps) {
  const [phase, setPhase] = useState<Phase>('read')
  const [revealed, setRevealed] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [xpDisplay, setXpDisplay] = useState(0)

  useEffect(() => {
    if (rating === null) return
    const controls = animate(0, xpFor(rating), {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setXpDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [rating])

  return (
    <div>
      <p className="onboard-desc" style={{ marginBottom: 20 }}>{copy.practiceIntro}</p>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '20px 22px',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
        }}
      >
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.15rem', lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>
          <span
            role="button"
            tabIndex={0}
            onClick={() => { if (phase === 'read') { playTap(); setPhase('clicked') } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && phase === 'read') { playTap(); setPhase('clicked') } }}
            style={{
              borderBottom: '2px solid var(--clay)',
              color: 'var(--clay)',
              fontWeight: 700,
              cursor: phase === 'read' ? 'pointer' : 'default',
              paddingBottom: 1,
            }}
          >
            {CHUNK_TEXT}
          </span>
          {SENTENCE_AFTER}
        </p>

        <AnimatePresence>
          {phase === 'read' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 10, marginBottom: 0 }}
            >
              {copy.practiceClickInstruction}
            </motion.p>
          )}

          {phase !== 'read' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}
            >
              <div style={{ fontWeight: 700, color: 'var(--clay)', fontSize: '0.95rem' }}>
                {copy.practiceChunkTranslation}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>
                {CHUNK_EXPLANATION}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'clicked' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => { playSelect(); setPhase('reviewing') }}
          >
            {copy.practiceCreateCard}
          </motion.button>
        )}
      </div>

      {(phase === 'reviewing' || phase === 'rated') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="onboard-desc" style={{ marginBottom: 12 }}>{copy.practiceReviewInstruction}</p>

          <div className="flashcard-scene" style={{ marginBottom: 16 }}>
            <div
              className={`flashcard-inner${revealed ? ' flipped' : ''}`}
              style={{ cursor: revealed ? 'default' : 'pointer', minHeight: 260 }}
              onClick={() => { if (!revealed) { playTap(); setRevealed(true) } }}
            >
              <div className="flashcard-face flashcard-front">
                <div className="flashcard-word">{CHUNK_TEXT}</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 'auto', textAlign: 'center' }}>
                  Tap to reveal
                </p>
              </div>
              <div className="flashcard-face flashcard-back">
                <div className="flashcard-word">{CHUNK_TEXT}</div>
                <p className="flashcard-translation">{copy.practiceChunkTranslation}</p>
                <p className="flashcard-explanation">{CHUNK_EXPLANATION}</p>
                <p className="flashcard-example">&ldquo;{CHUNK_EXAMPLE}&rdquo;</p>
              </div>
            </div>
          </div>

          {revealed && phase !== 'rated' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {RATINGS.map(({ label, n, bg, color, border }) => (
                <motion.button
                  key={n}
                  className="review-btn"
                  onClick={() => { (n >= 3 ? playSuccess : playSoft)(); setRating(n); setPhase('rated') }}
                  style={{ background: bg, color, borderColor: border, flex: 1 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {phase === 'rated' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.6rem', color: 'var(--auth-primary)' }}
              >
                +{xpDisplay} XP
              </motion.div>
              <StreakWidget streak={1} />
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
