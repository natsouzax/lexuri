'use client'

import { useEffect, useRef } from 'react'
import type { Flashcard } from '@/lib/types'
import { useWordHoverSave } from '@/hooks/useWordHoverSave'
import WordHoverTooltip from '@/components/WordHoverTooltip'

export interface DisplayLine {
  text: string
  time: number | null
}

interface Props {
  lines: DisplayLine[]
  activeLineIndex: number | null
  maxHeight?: string
  emptyMessage?: string
  /** Called right after a word is saved as a flashcard from the lyrics. */
  onWordSaved?: (card: Flashcard) => void
  /** Reset the hover cache/saved checkmarks when this changes (e.g. a new song). */
  resetKey?: unknown
}

function tokenize(text: string): { display: string; lookup: string }[] {
  return text.split(/(\s+)/).map((tok) => ({
    display: tok,
    lookup: tok.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '').toLowerCase(),
  }))
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

// The core touch-to-translate reading surface: a scrollable lyrics list that
// follows playback (when a time source drives activeLineIndex). Every word is
// hoverable for a full translation preview (translation + definition +
// example — this is the lyrics view, not the video captions overlay, so
// there's room to show it all) and clickable to save as a flashcard
// instantly. Used by both the saved song page and the Discover preview so
// the interaction is identical everywhere lyrics appear on their own.
export default function SyncedLyricsList({
  lines,
  activeLineIndex,
  maxHeight = '65vh',
  emptyMessage = 'No lyrics available.',
  onWordSaved,
  resetKey,
}: Props) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const { tooltip, savedWords, savingWord, onHover, onLeave, onWordClick, cancelHide, hideNow } =
    useWordHoverSave(resetKey, onWordSaved)

  useEffect(() => {
    if (activeLineIndex !== null) {
      lineRefs.current[activeLineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeLineIndex])

  return (
    <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--line)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Lyrics — hover a word to translate, click to save
      </div>
      <div style={{ maxHeight, overflowY: 'auto', padding: '8px 8px' }}>
        {lines.length > 0 ? lines.map((line, i) => {
          const isActive = activeLineIndex === i
          const tokens = tokenize(line.text)
          return (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el }}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                borderLeft: `3px solid ${isActive ? 'var(--clay)' : 'transparent'}`,
                background: isActive ? 'rgba(200,111,74,0.09)' : 'transparent',
                transition: 'all 100ms ease',
                fontSize: '0.91rem',
                lineHeight: 1.9,
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
              }}
            >
              {line.time !== null && (
                <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.45, flexShrink: 0, fontVariantNumeric: 'tabular-nums', paddingTop: 2 }}>
                  {formatTime(line.time)}
                </span>
              )}
              <span>
                {tokens.map((tok, j) => {
                  if (!tok.lookup) return <span key={j}>{tok.display}</span>
                  const isSaved = savedWords.has(tok.lookup)
                  const isSaving = savingWord === tok.lookup
                  return (
                    <span
                      key={j}
                      onMouseEnter={(e) => onHover(tok.lookup, line.text, e.currentTarget.getBoundingClientRect())}
                      onMouseLeave={onLeave}
                      onClick={() => !isSaved && !isSaving && onWordClick(tok.lookup, line.text)}
                      title={tok.lookup}
                      style={{
                        cursor: isSaved ? 'default' : 'pointer',
                        borderRadius: 3,
                        padding: isSaved ? '0 3px' : '0 1px',
                        color: isSaved ? '#1a1a1a' : isActive ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: isSaved ? 700 : isActive ? 600 : 400,
                        background: isSaved ? 'rgba(120,190,120,0.7)' : 'transparent',
                        opacity: isSaving ? 0.5 : 1,
                        transition: 'color 80ms, background 80ms, opacity 100ms',
                      }}
                    >
                      {tok.display}{isSaved ? ' ✓' : ''}
                    </span>
                  )
                })}
              </span>
            </div>
          )
        }) : (
          <div style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: '16px' }}>{emptyMessage}</div>
        )}
      </div>

      <WordHoverTooltip tooltip={tooltip} onMouseEnter={cancelHide} onMouseLeave={hideNow} />
    </div>
  )
}
