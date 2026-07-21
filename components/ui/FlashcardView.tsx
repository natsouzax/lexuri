'use client'

import { useEffect } from 'react'
import type { Flashcard } from '@/lib/types'

interface Props {
  card: Flashcard
  flipped: boolean
}

export default function FlashcardView({ card, flipped }: Props) {
  // Read the word/phrase out loud when the card flips, so the pronunciation
  // is right there the moment the user sees the explanation.
  useEffect(() => {
    if (!flipped || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(card.word)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
    return () => window.speechSynthesis.cancel()
  }, [flipped, card.word])

  return (
    <div className="flashcard-scene" style={{ minHeight: 200 }}>
      <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-word">{card.word}</div>
          {card.source_video && (
            <div className="flashcard-source">
              <span>▶</span>
              <span>From video · {card.source_video}</span>
            </div>
          )}
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back">
          <div className="flashcard-word">
            {card.word}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!window.speechSynthesis) return
                window.speechSynthesis.cancel()
                const u = new SpeechSynthesisUtterance(card.word)
                u.lang = 'en-US'
                window.speechSynthesis.speak(u)
              }}
              aria-label="Listen"
              style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9em', verticalAlign: 'middle' }}
            >
              🔊
            </button>
          </div>
          <p className="flashcard-explanation">{card.explanation}</p>
          {card.example && (
            <p className="flashcard-example">&ldquo;{card.example}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  )
}
