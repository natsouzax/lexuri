'use client'

import type { WordTooltipState } from '@/hooks/useWordHoverSave'

interface Props {
  tooltip: WordTooltipState | null
  onMouseEnter: () => void
  onMouseLeave: () => void
  /** Video captions: just the translation, no room/time to read more while the video keeps playing. */
  compact?: boolean
}

// Shared floating translation preview — reuses the same tooltip visuals as
// ChunkHighlighter's chunk tooltip so hover-translate looks identical
// everywhere it appears (video captions, lyrics lines).
export default function WordHoverTooltip({ tooltip, onMouseEnter, onMouseLeave, compact }: Props) {
  if (!tooltip) return null
  return (
    <div
      className="chunk-tooltip-fixed word-tooltip"
      style={{ left: tooltip.x, top: tooltip.y - 10 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="word-tooltip-label">{tooltip.word}</span>
      {tooltip.loading && <span style={{ color: 'rgba(255,250,240,0.65)', fontSize: '0.8rem' }}>…</span>}
      {tooltip.error && <span style={{ color: 'rgba(255,250,240,0.65)', fontSize: '0.8rem' }}>Couldn&apos;t translate</span>}
      {tooltip.def && (
        compact ? (
          <strong className="chunk-tooltip-translation">{tooltip.def.translation}</strong>
        ) : (
          <>
            <strong className="chunk-tooltip-translation">{tooltip.def.translation}</strong>
            <span className="chunk-tooltip-meaning">{tooltip.def.definition}</span>
            <span className="chunk-tooltip-example" style={{ marginTop: 2, opacity: 0.8, fontStyle: 'normal' }}>
              Click the word to save as a flashcard
            </span>
          </>
        )
      )}
    </div>
  )
}
