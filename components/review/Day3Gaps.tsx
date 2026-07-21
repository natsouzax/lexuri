'use client'

import { useMemo, useState } from 'react'
import type { Flashcard, TranscriptSegment } from '@/lib/types'

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
      setError('Escreva pelo menos um aprendizado — é ele que entra no seu glossário.')
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
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.3rem', marginBottom: 8 }}>
          Ciclo completo! 🎉
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>
          Seus aprendizados entraram no glossário.
        </p>
        {newVerses.length > 0 && (
          <div className="panel" style={{ marginBottom: 20, textAlign: 'center' }}>
            <span className="mini-label">🎼 Um verso novo na sua música</span>
            {newVerses.map((v, i) => (
              <p key={i} style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-line', margin: '10px 0 0' }}>
                {v}
              </p>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/flashcards" className="btn-secondary" style={{ textDecoration: 'none' }}>Ver glossário</a>
          <a href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>Próxima música →</a>
        </div>
      </div>
    )
  }

  if (phase === 'takeaways') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {gaps.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 16 }}>
            Você acertou {correctCount} de {gaps.length} trechos.
          </div>
        )}
        <div className="panel" style={{ marginBottom: 16 }}>
          <span className="mini-label">✍️ Antes de terminar</span>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', margin: '8px 0 4px' }}>
            Quais foram duas palavras ou aprendizados que mais marcaram você hoje?
          </p>
          <p className="panel-copy" style={{ marginBottom: 14 }}>
            Só o que você escrever aqui entra no seu glossário — e a cada dois
            aprendizados, um verso da sua música pessoal nasce.
          </p>
          <input
            className="input-field"
            placeholder="1º aprendizado (ex.: “by the way” = a propósito)"
            value={t1}
            onChange={(e) => setT1(e.target.value)}
            style={{ marginBottom: 10, width: '100%' }}
          />
          <input
            className="input-field"
            placeholder="2º aprendizado"
            value={t2}
            onChange={(e) => setT2(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        {error && <div className="alert-error">{error}</div>}
        <div style={{ textAlign: 'center' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={finishing} style={{ padding: '10px 28px' }}>
            {finishing ? <><span className="spinner" /> Salvando…</> : 'Concluir Day 3 ✓'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 16 }}>
        Complete os trechos da música
      </div>

      {gaps.map((gap, i) => {
        const chosen = answers[i]
        return (
          <div key={i} className="panel" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic' }}>
              “{gap.before}
              <span style={{ display: 'inline-block', minWidth: 80, borderBottom: '2px dashed var(--clay)', textAlign: 'center', fontWeight: 800, fontStyle: 'normal', color: chosen ? (chosen.toLowerCase() === gap.answer.toLowerCase() ? 'var(--moss)' : '#dc2626') : 'transparent' }}>
                {chosen ?? '____'}
              </span>
              {gap.after}”
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {gap.options.map((opt) => {
                const isChosen = chosen === opt
                const isCorrect = opt.toLowerCase() === gap.answer.toLowerCase()
                const showState = chosen !== undefined && isChosen
                return (
                  <button
                    key={opt}
                    onClick={() => chosen === undefined && setAnswers((a) => ({ ...a, [i]: opt }))}
                    disabled={chosen !== undefined}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 999,
                      border: `1.5px solid ${showState ? (isCorrect ? 'var(--moss)' : '#dc2626') : 'var(--line)'}`,
                      background: showState ? (isCorrect ? 'rgba(70,98,74,0.1)' : 'rgba(220,38,38,0.08)') : '#fff',
                      color: showState ? (isCorrect ? 'var(--moss)' : '#dc2626') : 'var(--ink)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: chosen === undefined ? 'pointer' : 'default',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {chosen !== undefined && chosen.toLowerCase() !== gap.answer.toLowerCase() && (
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '8px 0 0' }}>
                Resposta certa: <strong>{gap.answer}</strong>
              </p>
            )}
          </div>
        )
      })}

      {allAnswered && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn-primary" onClick={() => setPhase('takeaways')} style={{ padding: '10px 28px' }}>
            Continuar →
          </button>
        </div>
      )}
    </div>
  )
}
