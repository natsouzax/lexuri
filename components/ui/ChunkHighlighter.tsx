'use client'

import { useRef, useState } from 'react'
import type { ChunkItem } from '@/lib/types'
import { tokenizeText } from '@/lib/word-translations'

interface Segment {
  text: string
  chunk?: ChunkItem
}

const IMPORTANCE_ORDER = { high: 0, medium: 1, low: 2 }

function buildSegments(text: string, chunks: ChunkItem[]): Segment[] {
  const sorted = [...chunks].sort((a, b) => {
    const imp = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
    return imp !== 0 ? imp : (b.end - b.start) - (a.end - a.start)
  })
  const selected: ChunkItem[] = []
  for (const chunk of sorted) {
    if (!selected.some((c) => chunk.start < c.end && chunk.end > c.start)) {
      selected.push(chunk)
    }
  }
  selected.sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0
  for (const chunk of selected) {
    if (chunk.start > cursor) segments.push({ text: text.slice(cursor, chunk.start) })
    segments.push({ text: text.slice(chunk.start, chunk.end), chunk })
    cursor = chunk.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) })
  return segments
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type TooltipState =
  | { kind: 'chunk'; chunk: ChunkItem; nativeTranslation?: string; x: number; y: number }
  | { kind: 'word';  word: string;  translation: string;           x: number; y: number }

interface Props {
  text: string
  chunks: ChunkItem[]
  selectedChunk?: ChunkItem | null
  onChunkClick?: (chunk: ChunkItem) => void
  /** ISO language code from the user's native-language picker (e.g. "pt-BR"). */
  lang?: string | null
  /** chunk.text → native-language translation string */
  nativeTranslations?: Record<string, string>
}

export default function ChunkHighlighter({
  text,
  chunks,
  selectedChunk,
  onChunkClick,
  lang,
  nativeTranslations,
}: Props) {
  const segments = buildSegments(text, chunks)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showTranslation = lang && lang !== 'en'

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setTooltip(null), 160)
  }
  function cancelHide() { clearTimeout(hideTimer.current) }

  function showChunkTooltip(chunk: ChunkItem, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(hideTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      kind: 'chunk',
      chunk,
      nativeTranslation: lang ? nativeTranslations?.[chunk.text] : undefined,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  function showWordTooltip(word: string, translation: string, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(hideTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ kind: 'word', word, translation, x: rect.left + rect.width / 2, y: rect.top })
  }

  function speakText(t: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(t)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  // Renders a plain-text segment with word/phrase hover translations (light-bg variant)
  function renderWords(raw: string, segIdx: number) {
    if (!showTranslation) return <span key={segIdx}>{raw}</span>
    const tokens = tokenizeText(raw, lang!)
    return (
      <span key={segIdx}>
        {tokens.map((tok, j) => {
          if (tok.kind === 'plain') return <span key={j}>{tok.content}</span>
          const cssClass = tok.kind === 'phrase' ? 'phrase-mark-light' : 'word-mark-light'
          return (
            <span
              key={j}
              className={cssClass}
              onMouseEnter={(e) => showWordTooltip(tok.content, tok.translation, e)}
              onMouseLeave={scheduleHide}
            >
              {tok.content}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2.1, fontSize: '0.93rem' }}>
        {segments.map((seg, i) =>
          seg.chunk ? (
            <span
              key={i}
              onClick={() => onChunkClick?.(seg.chunk!)}
              onMouseEnter={(e) => showChunkTooltip(seg.chunk!, e)}
              onMouseLeave={scheduleHide}
              style={{
                backgroundColor:
                  selectedChunk?.text === seg.chunk.text
                    ? seg.chunk.color + '44'
                    : seg.chunk.color + '22',
                borderBottom: `2px solid ${seg.chunk.color}`,
                padding: '1px 2px',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: selectedChunk?.text === seg.chunk.text ? 700 : 400,
                transition: 'background 0.12s',
              }}
            >
              {seg.text}
            </span>
          ) : (
            renderWords(seg.text, i)
          ),
        )}
      </div>

      {tooltip && (
        <div
          className={`chunk-tooltip-fixed${tooltip.kind === 'word' ? ' word-tooltip' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
          onMouseEnter={cancelHide}
          onMouseLeave={() => setTooltip(null)}
        >
          {tooltip.kind === 'chunk' ? (
            <>
              <div className="chunk-tooltip-header">
                <span className="chunk-type-badge" style={{ color: tooltip.chunk.color }}>
                  {formatType(tooltip.chunk.type)}
                </span>
                <button
                  className="chunk-speak-btn"
                  onClick={(e) => speakText(tooltip.chunk.text, e)}
                  aria-label="Listen"
                >
                  🔊
                </button>
              </div>
              {tooltip.nativeTranslation && (
                <strong className="chunk-tooltip-translation">{tooltip.nativeTranslation}</strong>
              )}
              <span className="chunk-tooltip-meaning">{tooltip.chunk.contextual_translation}</span>
              {tooltip.chunk.why_it_matters && (
                <span className="chunk-tooltip-example">{tooltip.chunk.why_it_matters}</span>
              )}
            </>
          ) : (
            <>
              <span className="word-tooltip-label">{tooltip.word}</span>
              <strong className="chunk-tooltip-translation">{tooltip.translation}</strong>
            </>
          )}
        </div>
      )}
    </>
  )
}
