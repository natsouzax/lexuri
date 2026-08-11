'use client'

import { useEffect, useState } from 'react'
import { getDueCards, type SRSCard } from '@/lib/srs'
import { playSuccess, playSoft, playTap } from '@/lib/sfx'
import { useLang } from '@/lib/i18n'
import type { Flashcard } from '@/lib/types'
import { announceXP, type XPAwardResult } from '@/lib/xp'
import { SoundOnIcon } from '@/components/ui/Icons'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Sessão de repetição espaçada (SM-2): os cards vencidos voltam pouco
// antes do esquecimento. Notas: Again(0) / Hard(2) / Good(4) / Easy(5).
export default function SrsSession() {
  const { t } = useLang()
  const [queue, setQueue] = useState<SRSCard[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<Flashcard[]>('/api/flashcards')
      .then((cards) => setQueue(getDueCards(cards)))
      .catch(() => setQueue([]))
  }, [])

  function speak(word: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const card = queue?.[0]

  // Pronúncia automática quando o card entra na tela.
  useEffect(() => {
    if (started && card) speak(card.word)
  }, [started, card?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRate(quality: number) {
    if (!card || submitting) return
    if (quality >= 4) playSuccess(); else playSoft()
    setSubmitting(true)
    setError('')
    try {
      const result = await apiFetch<{ gamification?: XPAwardResult }>(`/api/flashcards/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality,
          event_id: `review:${card.id}:${card.last_reviewed?.toISOString() ?? 'first'}`,
        }),
      })
      announceXP('flashcard_review', result.gamification)
      setReviewed((n) => n + 1)
      setQueue((q) => (q ? q.slice(1) : q))
      setRevealed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (queue === null) return null

  return (
    <div className="panel" style={{ marginBottom: 32 }}>
      <span className="mini-label">{t('srs.title')}</span>
      <p className="panel-copy" style={{ marginBottom: 14 }}>{t('srs.body')}</p>

      {error && <div className="alert-error">{error}</div>}

      {queue.length === 0 && (
        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: reviewed > 0 ? 'var(--moss)' : 'var(--muted)', margin: 0 }}>
          {reviewed > 0 ? `${t('srs.done')} ${t('srs.doneBody')}` : t('srs.none')}
        </p>
      )}

      {queue.length > 0 && !started && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.3rem' }}>
            {queue.length}
          </span>
          <span style={{ fontSize: '0.88rem', color: 'var(--muted)', flex: 1 }}>{t('srs.due')}</span>
          <button className="btn-primary" onClick={() => setStarted(true)}>{t('srs.start')}</button>
        </div>
      )}

      {queue.length > 0 && started && card && (
        <div className="review-stack">
          <div className="review-progress">{reviewed + 1} / {reviewed + queue.length}</div>

          <div className="card review-card">
            <div className="review-word-row">
              <span className="review-word">{card.word}</span>
              <button type="button" className="review-speak" onClick={() => speak(card.word)} aria-label="Listen">
                <SoundOnIcon size={16} />
              </button>
            </div>
            {revealed && (
              <>
                <div className="review-translation">{card.translation}</div>
                {card.definition && <p className="review-explanation">{card.definition}</p>}
                {card.example && <p className="review-example">&ldquo;{card.example}&rdquo;</p>}
              </>
            )}
          </div>

          {!revealed ? (
            <div className="review-actions">
              <button className="btn-primary" onClick={() => { playTap(); setRevealed(true) }}>Show answer</button>
            </div>
          ) : (
            <div className="rate-btns">
              {/* Termos de imersão — sempre em inglês, mesmo com UI traduzida */}
              {[
                { q: 0, label: 'Again', color: '#dc2626' },
                { q: 2, label: 'Hard',  color: '#f59e0b' },
                { q: 4, label: 'Good',  color: 'var(--moss)' },
                { q: 5, label: 'Easy',  color: '#4A90E2' },
              ].map(({ q, label, color }) => (
                <button
                  key={q}
                  type="button"
                  className="rate-btn"
                  style={{ '--rate': color } as React.CSSProperties}
                  onClick={() => handleRate(q)}
                  disabled={submitting}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
