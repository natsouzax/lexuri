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
      style={{
        border: isSelected
          ? `1px solid ${chunk.color}`
          : `1px solid ${chunk.color}44`,
        borderLeft: `4px solid ${chunk.color}`,
        borderRadius: 8,
        padding: '12px 14px',
        background: isSelected ? `${chunk.color}12` : `${chunk.color}06`,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'background 0.12s, border-color 0.12s',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{
        display: 'block',
        fontSize: '0.62rem',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: chunk.color,
      }}>
        {TYPE_LABELS[chunk.type] ?? chunk.type}
      </span>

      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', lineHeight: 1.2 }}>
        {chunk.text}
      </div>

      {chunk.why_it_matters && (
        <p style={{ fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.45, margin: 0 }}>
          {chunk.why_it_matters}
        </p>
      )}

      {chunk.contextual_translation && (
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: chunk.color, margin: 0 }}>
          {chunk.contextual_translation}
        </p>
      )}

      {chunk.example_sentence && (
        <small style={{
          display: 'block',
          fontSize: '0.74rem',
          fontStyle: 'italic',
          color: 'var(--muted)',
          opacity: 0.75,
          lineHeight: 1.4,
          marginTop: 4,
          paddingLeft: 8,
          borderLeft: `2px solid ${chunk.color}44`,
        }}>
          {chunk.example_sentence}
        </small>
      )}

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '0.72rem', padding: '3px 10px' }}
          onClick={(e) => { e.stopPropagation(); playAudio() }}
          title="Play pronunciation"
        >
          Play
        </button>
        {chunk.flashcard_suggestion && onMakeFlashcard && (
          <button
            className="btn-primary"
            style={{ fontSize: '0.72rem', padding: '3px 12px' }}
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
