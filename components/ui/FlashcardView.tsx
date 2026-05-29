'use client'

import type { Flashcard } from '@/lib/types'

interface Props {
  card: Flashcard
  flipped: boolean
}

export default function FlashcardView({ card, flipped }: Props) {
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
          <div className="flashcard-word">{card.word}</div>
          <p className="flashcard-explanation">{card.explanation}</p>
          {card.example && (
            <p className="flashcard-example">&ldquo;{card.example}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  )
}
