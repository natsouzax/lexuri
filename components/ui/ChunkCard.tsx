'use client'

import type { ChunkItem } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  collocation: 'Collocation',
  phrasal_verb: 'Phrasal Verb',
  idiomatic: 'Idiom',
  lexical_chunk: 'Lexical Chunk',
  formulaic: 'Formulaic',
  grammar_pattern: 'Grammar Pattern',
  emotional: 'Emotional',
  conversational: 'Conversational',
}

interface Props {
  chunk: ChunkItem
  isSelected?: boolean
  onSelect?: (chunk: ChunkItem) => void
  onMakeFlashcard?: (chunk: ChunkItem) => void
  making?: boolean
  saved?: boolean
}

export default function ChunkCard({ chunk, isSelected, onSelect, onMakeFlashcard, making, saved }: Props) {
  function playAudio() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(chunk.text)
    utterance.lang = 'en-US'
    utterance.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div
      onClick={() => onSelect?.(chunk)}
      className={`chunk-card${onSelect ? ' is-clickable' : ''}${isSelected ? ' is-selected' : ''}`}
      style={{ '--chunk': chunk.color } as React.CSSProperties}
    >
      <span className="chunk-card-type">
        {TYPE_LABELS[chunk.type] ?? chunk.type}
      </span>

      <div className="chunk-card-text">{chunk.text}</div>

      {chunk.why_it_matters && (
        <p className="chunk-card-why">{chunk.why_it_matters}</p>
      )}

      {chunk.contextual_translation && (
        <p className="chunk-card-translation">{chunk.contextual_translation}</p>
      )}

      {chunk.example_sentence && (
        <small className="chunk-card-example">{chunk.example_sentence}</small>
      )}

      <div className="chunk-card-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={(e) => { e.stopPropagation(); playAudio() }}
          title="Play pronunciation"
        >
          Play
        </button>
        {chunk.flashcard_suggestion && onMakeFlashcard && (
          <button
            type="button"
            className="btn-primary"
            onClick={(e) => { e.stopPropagation(); onMakeFlashcard(chunk) }}
            disabled={making || saved}
          >
            {saved ? 'Saved' : making ? '...' : '+ Card'}
          </button>
        )}
      </div>
    </div>
  )
}
