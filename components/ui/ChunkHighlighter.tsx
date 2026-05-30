'use client'
import type { ChunkItem } from '@/lib/types'

interface Segment {
  text: string
  chunk?: ChunkItem
}

const IMPORTANCE_ORDER = { high: 0, medium: 1, low: 2 }

function buildSegments(text: string, chunks: ChunkItem[]): Segment[] {
  // Sort: importance first, then prefer larger chunks on ties
  const sorted = [...chunks].sort((a, b) => {
    const imp = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
    return imp !== 0 ? imp : (b.end - b.start) - (a.end - a.start)
  })

  // Greedy non-overlapping selection for rendering
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

interface Props {
  text: string
  chunks: ChunkItem[]
  selectedChunk?: ChunkItem | null
  onChunkClick?: (chunk: ChunkItem) => void
}

export default function ChunkHighlighter({ text, chunks, selectedChunk, onChunkClick }: Props) {
  const segments = buildSegments(text, chunks)

  return (
    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2.1, fontSize: '0.93rem' }}>
      {segments.map((seg, i) =>
        seg.chunk ? (
          <span
            key={i}
            title={seg.chunk.contextual_translation}
            onClick={() => onChunkClick?.(seg.chunk!)}
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
          <span key={i}>{seg.text}</span>
        ),
      )}
    </div>
  )
}
