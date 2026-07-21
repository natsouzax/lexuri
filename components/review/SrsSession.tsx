'use client'

import { useEffect, useState } from 'react'
import { getDueCards, type SRSCard } from '@/lib/srs'
import { useLang } from '@/lib/i18n'
import type { Flashcard } from '@/lib/types'

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
    setSubmitting(true)
    setError('')
    try {
      await apiFetch(`/api/flashcards/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      })
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
        <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>
            {reviewed + 1} / {reviewed + queue.length}
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '26px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.45rem' }}>
                {card.word}
              </span>
              <button onClick={() => speak(card.word)} aria-label="Play" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🔊</button>
            </div>
            {revealed && (
              <>
                <div style={{ fontSize: '1rem', color: 'var(--clay)', fontWeight: 700, margin: '10px 0 8px' }}>
                  {card.translation}
                </div>
                {card.definition && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 8px' }}>{card.definition}</p>
                )}
                {card.example && (
                  <p style={{ fontSize: '0.84rem', fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>“{card.example}”</p>
                )}
              </>
            )}
          </div>

          {!revealed ? (
            <button className="btn-primary" onClick={() => setRevealed(true)} style={{ padding: '10px 32px' }}>
              {t('srs.show')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { q: 0, label: t('srs.again'), color: '#dc2626' },
                { q: 2, label: t('srs.hard'),  color: '#f59e0b' },
                { q: 4, label: t('srs.good'),  color: 'var(--moss)' },
                { q: 5, label: t('srs.easy'),  color: '#4A90E2' },
              ].map(({ q, label, color }) => (
                <button
                  key={q}
                  onClick={() => handleRate(q)}
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 999,
                    border: `1.5px solid ${color}`,
                    background: 'transparent',
                    color,
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    opacity: submitting ? 0.5 : 1,
                  }}
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
