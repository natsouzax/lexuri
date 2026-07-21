'use client'

import { useRef, useState } from 'react'
import type { ChunkItem, Flashcard } from '@/lib/types'
import { useWordHoverSave } from '@/hooks/useWordHoverSave'
import WordHoverTooltip from '@/components/WordHoverTooltip'

interface Segment {
  text: string
  chunk?: ChunkItem
}

const IMPORTANCE_ORDER = { high: 0, medium: 1, low: 2 }
const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g

function normalizeWord(word: string): string {
  return word.replace(/[^A-Za-z']/g, '').toLowerCase().replace(/^'+|'+$/g, '')
}

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

interface ChunkTooltipState {
  chunk: ChunkItem
  nativeTranslation?: string
  x: number
  y: number
}

interface Props {
  text: string
  chunks: ChunkItem[]
  selectedChunk?: ChunkItem | null
  onChunkClick?: (chunk: ChunkItem) => void
  /** ISO language code from the user's native-language picker (e.g. "pt-BR"). */
  lang?: string | null
  /** chunk.text → native-language translation string */
  nativeTranslations?: Record<string, string>
  /** Video/lesson id — resets the word-hover cache when it changes. */
  videoId?: string
  /** Called right after a plain word is saved as a flashcard from a hover-click. */
  onWordSaved?: (card: Flashcard) => void
}

export default function ChunkHighlighter({
  text,
  chunks,
  selectedChunk,
  onChunkClick,
  lang,
  nativeTranslations,
  videoId,
  onWordSaved,
}: Props) {
  const segments = buildSegments(text, chunks)
  const [chunkTooltip, setChunkTooltip] = useState<ChunkTooltipState | null>(null)
  const hideChunkTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Same hover-translate + click-to-save-flashcard interaction as the video
  // captions (YoutubeSyncPlayer) — shared hook so the behavior and the
  // tooltip look identical everywhere text is shown.
  const { tooltip: wordTooltip, savedWords, savingWord, onHover, onLeave, onWordClick, cancelHide, hideNow } =
    useWordHoverSave(videoId ?? text.slice(0, 40), onWordSaved)

  function scheduleHideChunk() {
    hideChunkTimer.current = setTimeout(() => setChunkTooltip(null), 160)
  }
  function cancelHideChunk() { clearTimeout(hideChunkTimer.current) }

  function showChunkTooltip(chunk: ChunkItem, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(hideChunkTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setChunkTooltip({
      chunk,
      nativeTranslation: lang ? nativeTranslations?.[chunk.text] : undefined,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  function speakText(t: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(t)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  // Plain-text segment: every word is hoverable/clickable, same as captions.
  function renderPlainWords(raw: string, segIdx: number) {
    const parts: React.ReactNode[] = []
    let lastIdx = 0
    let wc = 0
    const regex = new RegExp(WORD_RE.source, 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(raw)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={`${segIdx}-g${wc}`}>{raw.slice(lastIdx, match.index)}</span>)
      }
      const word = match[0]
      const norm = normalizeWord(word)
      const isSaved = savedWords.has(norm)
      const isSaving = savingWord === norm
      parts.push(
        <span
          key={`${segIdx}-w${wc++}`}
          className="word-mark-light"
          onMouseEnter={(e) => onHover(norm, raw, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={onLeave}
          onClick={() => !isSaved && !isSaving && onWordClick(norm, raw)}
          style={{
            cursor: isSaved ? 'default' : 'pointer',
            background: isSaved ? 'rgba(120,190,120,0.5)' : undefined,
            fontWeight: isSaved ? 700 : undefined,
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          {word}{isSaved ? ' ✓' : ''}
        </span>,
      )
      lastIdx = match.index + word.length
    }
    if (lastIdx < raw.length) parts.push(<span key={`${segIdx}-tail`}>{raw.slice(lastIdx)}</span>)
    return <span key={segIdx}>{parts}</span>
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
              onMouseLeave={scheduleHideChunk}
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
            renderPlainWords(seg.text, i)
          ),
        )}
      </div>

      {chunkTooltip && (
        <div
          className="chunk-tooltip-fixed"
          style={{ left: chunkTooltip.x, top: chunkTooltip.y - 10 }}
          onMouseEnter={cancelHideChunk}
          onMouseLeave={() => setChunkTooltip(null)}
        >
          <div className="chunk-tooltip-header">
            <span className="chunk-type-badge" style={{ color: chunkTooltip.chunk.color }}>
              {formatType(chunkTooltip.chunk.type)}
            </span>
            <button
              className="chunk-speak-btn"
              onClick={(e) => speakText(chunkTooltip.chunk.text, e)}
              aria-label="Listen"
            >
              🔊
            </button>
          </div>
          {chunkTooltip.nativeTranslation && (
            <strong className="chunk-tooltip-translation">{chunkTooltip.nativeTranslation}</strong>
          )}
          <span className="chunk-tooltip-meaning">{chunkTooltip.chunk.contextual_translation}</span>
          {chunkTooltip.chunk.why_it_matters && (
            <span className="chunk-tooltip-example">{chunkTooltip.chunk.why_it_matters}</span>
          )}
        </div>
      )}

      <WordHoverTooltip tooltip={wordTooltip} onMouseEnter={cancelHide} onMouseLeave={hideNow} />
    </>
  )
}
