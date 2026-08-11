'use client'

import { useEffect, useState } from 'react'
import { playSoft, playSuccess, playFanfare } from '@/lib/sfx'
import type { Flashcard } from '@/lib/types'
import { SoundOnIcon } from '@/components/ui/Icons'
import { announceXP, type XPAwardResult } from '@/lib/xp'

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
      const result = await apiFetch<{ gamification?: XPAwardResult }>(`/api/flashcards/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality,
          event_id: `review:${card.id}:${card.last_reviewed ?? 'first'}`,
        }),
      }).catch(() => null)
      announceXP('flashcard_review', result?.gamification)
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
    <div className="review-stack">
      <div className="review-progress">{index + 1} / {cards.length}</div>

      <div className="panel review-card">
        <div className="review-word-row">
          <span className="review-word">{card.word}</span>
          <button type="button" className="review-speak" onClick={() => playAudio(card.word)} aria-label="Listen">
            <SoundOnIcon size={17} />
          </button>
        </div>

        {revealed && (
          <>
            <div className="review-translation">{card.translation}</div>
            {card.explanation && <p className="review-explanation">{card.explanation}</p>}
            {card.example && <p className="review-example">&ldquo;{card.example}&rdquo;</p>}
          </>
        )}
      </div>

      {!revealed ? (
        <div className="review-actions">
          <button className="btn-primary" onClick={() => setRevealed(true)}>Show answer</button>
        </div>
      ) : (
        <div className="rate-btns">
          {/* Termos de imersão — sempre em inglês */}
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
              disabled={submitting || finishing}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
