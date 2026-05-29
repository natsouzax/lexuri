import type { SRSCard } from '@/lib/srs'

interface Props {
  card: SRSCard
  onReview: (quality: number) => void
  reviewing?: boolean
}

export default function DeckCard({ card, onReview, reviewing }: Props) {
  return (
    <div className="deck-card">
      <div className="deck-word">{card.word}</div>
      <p className="deck-definition">{card.definition}</p>
      <div className="review-buttons">
        {[0, 1, 2, 3, 4, 5].map((q) => (
          <button
            key={q}
            className="review-btn"
            onClick={() => onReview(q)}
            disabled={reviewing}
            title={q < 3 ? 'Forgot' : q < 4 ? 'Hard' : q < 5 ? 'Good' : 'Easy'}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
