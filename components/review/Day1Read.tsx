'use client'

import { useEffect, useState } from 'react'
import { playSoft, playSuccess, playFanfare } from '@/lib/sfx'
import type { Flashcard } from '@/lib/types'

interface Props {
  cards: Flashcard[]
  onDone: () => void
  finishing: boolean
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Day 1: mesma mecânica do SRS — vira o card e avalia a dificuldade
// (Again/Hard/Good/Easy), gravando via SM-2 em /api/flashcards/[id]/review.
// Termos de imersão sempre em inglês.
export default function Day1Read({ cards, onDone, finishing }: Props) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const card = cards[index]
  const isLast = index >= cards.length - 1

  function playAudio(word: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  // Pronúncia automática ao trocar de card.
  useEffect(() => {
    if (card) { playSoft(); playAudio(card.word) }
  }, [card?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRate(quality: number) {
    if (!card || submitting) return
    if (quality >= 4) playSuccess(); else playSoft()
    setSubmitting(true)
    try {
      await apiFetch(`/api/flashcards/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      }).catch(() => {})
      if (isLast) {
        playFanfare()
        onDone()
      } else {
        setRevealed(false)
        setIndex((i) => i + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!card) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
        {index + 1} / {cards.length}
      </div>

      <div className="panel" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.6rem' }}>
            {card.word}
          </span>
          <button
            onClick={() => playAudio(card.word)}
            aria-label="Listen"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            🔊
          </button>
        </div>

        {revealed && (
          <>
            <div style={{ fontSize: '1.05rem', color: 'var(--clay)', fontWeight: 700, margin: '10px 0 14px' }}>
              {card.translation}
            </div>
            {card.explanation && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
                {card.explanation}
              </p>
            )}
            {card.example && (
              <p style={{ fontSize: '0.85rem', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                “{card.example}”
              </p>
            )}
          </>
        )}
      </div>

      {!revealed ? (
        <div style={{ textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => setRevealed(true)} style={{ padding: '10px 32px' }}>
            Show answer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Termos de imersão — sempre em inglês */}
          {[
            { q: 0, label: 'Again', color: '#dc2626' },
            { q: 2, label: 'Hard',  color: '#f59e0b' },
            { q: 4, label: 'Good',  color: 'var(--moss)' },
            { q: 5, label: 'Easy',  color: '#4A90E2' },
          ].map(({ q, label, color }) => (
            <button
              key={q}
              onClick={() => handleRate(q)}
              disabled={submitting || finishing}
              style={{
                padding: '9px 20px',
                borderRadius: 999,
                border: `1.5px solid ${color}`,
                background: 'transparent',
                color,
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                opacity: submitting || finishing ? 0.5 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
