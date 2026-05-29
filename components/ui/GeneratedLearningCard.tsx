import type { Flashcard } from '@/lib/types'

interface Props {
  card: Flashcard
}

export default function GeneratedLearningCard({ card }: Props) {
  return (
    <div className="learning-card">
      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>
        {card.word}
        {card.translation && (
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400, fontSize: '0.88rem', color: 'var(--muted)', marginLeft: 10 }}>
            {card.translation}
          </span>
        )}
      </div>
      {card.explanation && <p style={{ fontSize: '0.9rem', margin: '0 0 6px' }}>{card.explanation}</p>}
      {card.example && (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0, borderLeft: '2px solid var(--clay)', paddingLeft: 10 }}>
          &ldquo;{card.example}&rdquo;
        </p>
      )}
    </div>
  )
}
