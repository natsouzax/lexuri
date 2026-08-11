'use client'

import { useMemo, useState } from 'react'
import type { Flashcard, TranscriptSegment } from '@/lib/types'
import { useLang } from '@/lib/i18n'

interface Props {
  cards: Flashcard[]
  segments: TranscriptSegment[]
  onSubmitTakeaways: (texts: string[]) => Promise<void>
  finishing: boolean
  newVerses: string[]
}

interface Gap {
  before: string
  answer: string
  after: string
  options: string[]
}

const MAX_GAPS = 5

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cleanLine(text: string): string {
  return text.replace(/♪/g, '').replace(/\s+/g, ' ').trim()
}

// Monta os exercícios: linhas da música que contêm uma palavra salva,
// com a palavra escondida e 3 opções.
function buildGaps(cards: Flashcard[], segments: TranscriptSegment[]): Gap[] {
  const words = cards.map((c) => c.word).filter((w) => w.length > 2)
  const gaps: Gap[] = []
  const usedWords = new Set<string>()

  for (const seg of shuffle(segments)) {
    if (gaps.length >= MAX_GAPS) break
    const line = cleanLine(seg.text)
    if (line.length < 12) continue
    for (const word of words) {
      if (usedWords.has(word)) continue
      const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i')
      const m = line.match(re)
      if (!m || m.index === undefined) continue
      const distractors = shuffle(words.filter((w) => w !== word)).slice(0, 2)
      if (distractors.length < 2) continue
      gaps.push({
        before: line.slice(0, m.index),
        answer: m[1],
        after: line.slice(m.index + m[1].length),
        options: shuffle([m[1], ...distractors]),
      })
      usedWords.add(word)
      break
    }
  }
  return gaps
}

// Day 3: completar trechos da letra + escrever os takeaways da semana.
export default function Day3Gaps({ cards, segments, onSubmitTakeaways, finishing, newVerses }: Props) {
  const { t } = useLang()
  const gaps = useMemo(() => buildGaps(cards, segments), [cards, segments])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [phase, setPhase] = useState<'gaps' | 'takeaways' | 'done'>(gaps.length > 0 ? 'gaps' : 'takeaways')
  const [t1, setT1] = useState('')
  const [t2, setT2] = useState('')
  const [error, setError] = useState('')

  const allAnswered = gaps.every((_, i) => answers[i] !== undefined)
  const correctCount = gaps.filter((g, i) => answers[i]?.toLowerCase() === g.answer.toLowerCase()).length

  async function handleSubmit() {
    const texts = [t1, t2].map((t) => t.trim()).filter(Boolean)
    if (texts.length === 0) {
      setError(t('act.takeawayError'))
      return
    }
    setError('')
    try {
      await onSubmitTakeaways(texts)
      setPhase('done')
    } catch (e) {
      setError(String(e))
    }
  }

  if (phase === 'done') {
    return (
      <div className="review-stack" style={{ textAlign: 'center' }}>
        <p className="review-done-title">{t('act.done.title')}</p>
        <p className="review-done-body">{t('act.done.body')}</p>
        {newVerses.length > 0 && (
          <div className="panel" style={{ marginBottom: 20 }}>
            <span className="mini-label">{t('act.done.verse')}</span>
            {newVerses.map((v, i) => (
              <p key={i} className="review-verse">{v}</p>
            ))}
          </div>
        )}
        <div className="review-actions">
          <a href="/flashcards" className="btn-secondary">{t('act.done.glossary')}</a>
          <a href="/my-song" className="btn-secondary">Music Studio</a>
          <a href="/feed" className="btn-primary">{t('runner.nextSong')}</a>
        </div>
      </div>
    )
  }

  if (phase === 'takeaways') {
    return (
      <div className="review-stack">
        {gaps.length > 0 && (
          <div className="review-score">{t('act.gotRight', { n: correctCount, total: gaps.length })}</div>
        )}
        <div className="panel" style={{ marginBottom: 16 }}>
          <span className="mini-label">{t('act.beforeFinish')}</span>
          <p className="takeaway-question">{t('act.takeawayQuestion')}</p>
          <p className="panel-copy" style={{ marginBottom: 14 }}>{t('act.takeawayHint')}</p>
          <input
            className="input-field takeaway-input"
            placeholder={t('act.takeaway1')}
            value={t1}
            onChange={(e) => setT1(e.target.value)}
          />
          <input
            className="input-field takeaway-input"
            placeholder={t('act.takeaway2')}
            value={t2}
            onChange={(e) => setT2(e.target.value)}
          />
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div className="review-actions">
          <button className="btn-primary" onClick={handleSubmit} disabled={finishing}>
            {finishing ? <><span className="spinner" /> {t('act.saving')}</> : t('act.finishDay3')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="review-stack-wide">
      <div className="review-progress">{t('act.fillTitle')}</div>

      {gaps.map((gap, i) => {
        const chosen = answers[i]
        const chosenIsRight = chosen !== undefined && chosen.toLowerCase() === gap.answer.toLowerCase()
        return (
          <div key={i} className="panel gap-panel">
            <p className="gap-line">
              &ldquo;{gap.before}
              <span className={`gap-blank${chosen === undefined ? '' : chosenIsRight ? ' is-correct' : ' is-wrong'}`}>
                {chosen ?? '____'}
              </span>
              {gap.after}&rdquo;
            </p>
            <div className="gap-options">
              {gap.options.map((opt) => {
                const showState = chosen === opt
                const isCorrect = opt.toLowerCase() === gap.answer.toLowerCase()
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`gap-option${showState ? (isCorrect ? ' is-correct' : ' is-wrong') : ''}`}
                    onClick={() => chosen === undefined && setAnswers((a) => ({ ...a, [i]: opt }))}
                    disabled={chosen !== undefined}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {chosen !== undefined && !chosenIsRight && (
              <p className="gap-answer">
                {t('act.correctAnswer')} <strong>{gap.answer}</strong>
              </p>
            )}
          </div>
        )
      })}

      {allAnswered && (
        <div className="review-actions" style={{ marginTop: 8 }}>
          <button className="btn-primary" onClick={() => setPhase('takeaways')}>{t('act.continue')}</button>
        </div>
      )}
    </div>
  )
}
