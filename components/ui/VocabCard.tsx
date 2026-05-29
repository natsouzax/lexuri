import type { VocabItem } from '@/lib/types'

interface Props {
  item: VocabItem
  onGenerateFlashcard: () => void
  loading?: boolean
}

export default function VocabCard({ item, onGenerateFlashcard, loading }: Props) {
  return (
    <div className="vocab-card">
      <div className="vocab-word">{item.word}</div>
      {item.context && <p className="vocab-context">&ldquo;{item.context}&rdquo;</p>}
      {item.reason && <p className="vocab-reason">{item.reason}</p>}
      <div className="vocab-actions">
        <button
          className="btn-primary"
          onClick={onGenerateFlashcard}
          disabled={loading}
        >
          {loading ? <><span className="spinner" />Generating…</> : 'Generate flashcard'}
        </button>
      </div>
    </div>
  )
}
