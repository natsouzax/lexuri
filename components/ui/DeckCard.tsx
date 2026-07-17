import type { SRSCard } from '@/lib/srs'

interface Props {
  card: SRSCard
  onReview: (quality: number) => void
  reviewing?: boolean
}

const QUALITY = [
  { label: 'Again', n: 0, bg: 'rgba(192,57,43,0.1)',   color: '#c0392b', border: 'rgba(192,57,43,0.35)' },
  { label: 'Hard',  n: 1, bg: 'rgba(200,111,74,0.1)',  color: '#c86f4a', border: 'rgba(200,111,74,0.35)' },
  { label: 'Fair',  n: 2, bg: 'rgba(184,134,11,0.1)',  color: '#b8860b', border: 'rgba(184,134,11,0.3)'  },
  { label: 'Good',  n: 3, bg: 'rgba(39,174,96,0.1)',   color: '#27ae60', border: 'rgba(39,174,96,0.3)'   },
  { label: 'Great', n: 4, bg: 'rgba(30,132,73,0.12)',  color: '#1e8449', border: 'rgba(30,132,73,0.3)'   },
  { label: 'Easy',  n: 5, bg: 'rgba(17,122,101,0.12)', color: '#117a65', border: 'rgba(17,122,101,0.3)'  },
]

export default function DeckCard({ card, onReview, reviewing }: Props) {
  return (
    <div className="deck-card">
      <div className="deck-word">{card.word}</div>
      <p className="deck-definition">{card.definition}</p>
      <div className="review-buttons">
        {QUALITY.map(({ label, n, bg, color, border }) => (
          <button
            key={n}
            className="review-btn"
            onClick={() => onReview(n)}
            disabled={reviewing}
            title={label}
            style={{ background: bg, color, borderColor: border }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{n}</span>
            <span style={{ fontSize: '0.62rem', opacity: 0.85 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
