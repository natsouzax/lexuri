import type { Flashcard } from '@/lib/types'

interface Props {
  card: Flashcard
}

export default function GeneratedLearningCard({ card }: Props) {
  return (
    <div className="learning-card">
      <div className="learning-card-word">
        {card.word}
        {card.translation && (
          <span className="learning-card-translation">{card.translation}</span>
        )}
      </div>
      {card.explanation && <p className="learning-card-explanation">{card.explanation}</p>}
      {card.example && (
        <p className="learning-card-example">&ldquo;{card.example}&rdquo;</p>
      )}
    </div>
  )
}
