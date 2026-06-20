'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, animate } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

type Result = { cardId: string; quality: number; word: string }

interface Props {
  results: Result[]
  dueRemaining: number
  onRestart: () => void
}

function AnimatedNumber({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctrls = animate(0, to, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (el) el.textContent = Math.round(v) + suffix },
    })
    return () => ctrls.stop()
  }, [to, suffix])
  return <span ref={ref}>0{suffix}</span>
}

const RATING_LABEL: Record<number, string> = { 5: 'Easy', 4: 'Easy', 3: 'Good', 1: 'Hard', 0: 'Again' }
const RATING_COLOR: Record<string, string> = {
  Easy: 'rgba(70,98,74,0.14)',
  Good: 'rgba(70,98,74,0.09)',
  Hard: 'rgba(200,111,74,0.12)',
  Again: 'rgba(192,57,43,0.1)',
}
const RATING_TEXT: Record<string, string> = {
  Easy: 'var(--moss)',
  Good: '#3a7a3f',
  Hard: 'var(--clay)',
  Again: '#c0392b',
}

export default function ReviewSummary({ results, dueRemaining, onRestart }: Props) {
  const reviewed = results.length
  const correct = results.filter((r) => r.quality >= 3).length
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0
  const xpEarned = results.reduce((sum, r) => {
    if (r.quality >= 4) return sum + 15
    if (r.quality >= 3) return sum + 10
    return sum + 3
  }, 0)

  const accuracyColor = accuracy >= 70 ? 'var(--moss)' : accuracy >= 50 ? '#c89444' : 'var(--muted)'

  const bestStreak = (() => {
    let best = 0, cur = 0
    for (const r of results) {
      if (r.quality >= 3) { cur++; best = Math.max(best, cur) } else cur = 0
    }
    return best
  })()

  const headline =
    accuracy >= 80 ? 'Sessão excelente!' :
    accuracy >= 60 ? 'Boa sessão!' :
    'Sessão concluída'

  const message =
    reviewed >= 5 && correct >= 3
      ? `Você revisou ${correct} ${correct === 1 ? 'palavra' : 'palavras'} — essas revisões espaçadas são as que fixam no longo prazo.`
      : accuracy >= 70
        ? 'Memória consistente. Continue nesse ritmo.'
        : 'Continue revisando — a repetição é o que cria a memória duradoura.'

  return (
    <div className="review-summary">
      {/* Header */}
      <motion.div
        className="rsm-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <motion.div
          className="rsm-icon"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        >
          {accuracy >= 70 ? '★' : '✓'}
        </motion.div>
        <h2 className="rsm-title">{headline}</h2>
        {bestStreak >= 5 && (
          <motion.span
            className="rsm-best-badge"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: EASE_OUT }}
          >
            Melhor série: {bestStreak} ✦
          </motion.span>
        )}
      </motion.div>

      {/* Stats */}
      <div className="rsm-stats">
        {([
          { label: 'Revisados', value: reviewed, suffix: '' },
          { label: 'Acerto',    value: accuracy, suffix: '%' },
          { label: 'XP ganho',  value: xpEarned, suffix: '' },
        ] as const).map(({ label, value, suffix }, i) => (
          <motion.div
            key={label}
            className="rsm-stat"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: EASE_OUT }}
          >
            <span
              className="rsm-stat-num"
              style={{
                color:
                  label === 'Acerto'   ? accuracyColor :
                  label === 'XP ganho' ? 'var(--clay)' : 'var(--ink)',
              }}
            >
              <AnimatedNumber to={value} suffix={suffix} />
            </span>
            <span className="rsm-stat-label">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Message */}
      <motion.p
        className="rsm-msg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55, ease: EASE_OUT }}
      >
        {message}
      </motion.p>

      {/* Word list */}
      <motion.div
        className="rsm-words"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65, ease: EASE_OUT }}
      >
        {results.map((r, i) => {
          const ratingKey = RATING_LABEL[r.quality] ?? 'Hard'
          return (
            <motion.div
              key={r.cardId}
              className="rsm-word-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.7 + i * 0.04, ease: EASE_OUT }}
            >
              <span className="rsm-word">{r.word}</span>
              <span
                className="rsm-word-badge"
                style={{
                  background: RATING_COLOR[ratingKey] ?? 'transparent',
                  color: RATING_TEXT[ratingKey] ?? 'var(--muted)',
                }}
              >
                {ratingKey}
              </span>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Actions */}
      <motion.div
        className="rsm-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.85, ease: EASE_OUT }}
      >
        <Link href="/reports" className="btn-secondary">Ver progresso</Link>
        <Link href="/feed" className="btn-primary">Criar flashcards</Link>
        {dueRemaining > 0 && (
          <button className="btn-secondary" onClick={onRestart}>
            Continuar ({dueRemaining} restantes)
          </button>
        )}
      </motion.div>
    </div>
  )
}
