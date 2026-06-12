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

const IMPORTANCE_DOT: Record<string, string> = {
  high: '#E91E63',
  medium: '#FF9800',
  low: '#9E9E9E',
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
        border: isSelected ? `2px solid ${chunk.color}` : `1px solid ${chunk.color}40`,
        borderLeft: `4px solid ${chunk.color}`,
        borderRadius: 8,
        padding: '14px 16px',
        background: isSelected ? `${chunk.color}12` : `${chunk.color}06`,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{ width: 8, height: 8, borderRadius: '50%', background: IMPORTANCE_DOT[chunk.importance], flexShrink: 0, display: 'inline-block' }}
            title={`${chunk.importance} importance`}
          />
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.08rem', overflowWrap: 'anywhere' }}>
            {chunk.text}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            background: chunk.color + '22',
            color: chunk.color,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {TYPE_LABELS[chunk.type] ?? chunk.type}
        </span>
      </div>

      <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 2 }}>
        {chunk.contextual_translation}
      </div>
      {chunk.literal_translation !== chunk.contextual_translation && (
        <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 6, opacity: 0.75 }}>
          literal: {chunk.literal_translation}
        </div>
      )}
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
        {chunk.why_it_matters}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginRight: 'auto' }}>
          {chunk.learner_level} · freq {chunk.frequency_score}/10
        </span>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '0.73rem', padding: '4px 10px' }}
          onClick={(e) => { e.stopPropagation(); playAudio() }}
          title="Play pronunciation"
        >
          Play
        </button>
        {chunk.flashcard_suggestion && onMakeFlashcard && (
          <button
            className="btn-primary"
            style={{ fontSize: '0.73rem', padding: '4px 12px' }}
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
