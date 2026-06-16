'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChunkItem, TranscriptSegment } from '@/lib/types'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        options: {
          videoId?: string
          playerVars?: Record<string, number>
          events?: {
            onReady?: () => void
            onStateChange?: (e: { data: number }) => void
          }
        },
      ) => YTPlayer
      PlayerState?: { PLAYING: number } & Record<string, number>
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  getCurrentTime(): number
  destroy(): void
}

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g
const IMPORTANCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function normalizeWord(word: string): string {
  return word.replace(/[^A-Za-z']/g, '').toLowerCase().replace(/^'+|'+$/g, '')
}

function isNonSpeech(text: string): boolean {
  const t = (text ?? '').trim()
  if (!t) return true
  if (/^\[[^\]]+\]$/.test(t)) return true
  if (!/[A-Za-z]/.test(t)) return true
  return false
}

// Split a text into alternating plain/chunk regions (same algorithm as ChunkHighlighter)
function splitByChunks(
  text: string,
  chunks: ChunkItem[],
): Array<{ text: string; chunk?: ChunkItem }> {
  const sorted = [...chunks].sort((a, b) => {
    const imp = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
    return imp !== 0 ? imp : (b.end - b.start) - (a.end - a.start)
  })
  const selected: ChunkItem[] = []
  for (const c of sorted) {
    if (!selected.some((s) => c.start < s.end && c.end > s.start)) selected.push(c)
  }
  selected.sort((a, b) => a.start - b.start)

  const parts: Array<{ text: string; chunk?: ChunkItem }> = []
  let cursor = 0
  for (const c of selected) {
    if (c.start > cursor) parts.push({ text: text.slice(cursor, c.start) })
    parts.push({ text: text.slice(c.start, c.end), chunk: c })
    cursor = c.end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

// Render plain text as individually clickable words.
// No per-word background — the overlay container provides the single dark bar.
// Only selected words get a highlight.
function renderWords(
  text: string,
  keyPrefix: string,
  selected: Set<string>,
  toggleWord: (w: string) => void,
): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let wc = 0
  const regex = new RegExp(WORD_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={`${keyPrefix}-g${wc}`}>{text.slice(lastIdx, match.index)}</span>)
    }
    const word = match[0]
    const norm = normalizeWord(word)
    const isSel = selected.has(norm)
    parts.push(
      <span
        key={`${keyPrefix}-w${wc++}`}
        onClick={() => toggleWord(norm)}
        style={{
          cursor: 'pointer',
          pointerEvents: 'auto',
          borderRadius: 4,
          padding: isSel ? '1px 4px' : undefined,
          background: isSel ? 'rgba(246,202,95,0.9)' : undefined,
          color:  '#1a1a1a',
          fontWeight: isSel ? 900 : undefined,
          transition: 'background 100ms ease',
        }}
      >
        {word}
      </span>,
    )
    lastIdx = match.index + word.length
  }
  if (lastIdx < text.length) {
    parts.push(<span key={`${keyPrefix}-tail`}>{text.slice(lastIdx)}</span>)
  }
  return parts
}

interface Props {
  videoId: string
  segments: TranscriptSegment[]
  selectedWords: string[]
  onWordsChange: (words: string[]) => void
  chunks?: ChunkItem[]
  selectedChunk?: ChunkItem | null
  onChunkSelect?: (chunk: ChunkItem) => void
}

export default function YoutubeSyncPlayer({
  videoId,
  segments,
  selectedWords,
  onWordsChange,
  chunks,
  selectedChunk,
  onChunkSelect,
}: Props) {
  const playerRef        = useRef<YTPlayer | null>(null)
  const playerDivRef     = useRef<HTMLDivElement>(null)
  const containerRef     = useRef<HTMLDivElement>(null)
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef           = useRef<number | null>(null)
  const anchorRef        = useRef({ videoTime: 0, wallTime: 0 })
  const isPlayingRef     = useRef(false)
  const holdRef          = useRef({ idx: -1, until: 0 })
  const selectedSet      = useRef(new Set(selectedWords))
  const [, forceUpdate]  = useState(0)
  const [captionDelay, setCaptionDelay] = useState(0)
  const [activeSegIdx, setActiveSegIdx] = useState(-1)
  const [showCaptions, setShowCaptions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const captionDelayRef  = useRef(0)
  const updateActiveRef  = useRef<(t: number) => void>(() => {})

  // Pre-compute each segment's start offset in the full transcript (segments joined by ' ')
  const segmentOffsets = useMemo(() => {
    const offsets: number[] = []
    let pos = 0
    for (const seg of segments) {
      offsets.push(pos)
      pos += seg.text.length + 1
    }
    return offsets
  }, [segments])

  // Chunks that overlap the active segment, with positions relative to that segment's text
  const activeChunks = useMemo(() => {
    if (!chunks?.length || activeSegIdx < 0) return []
    const segStart = segmentOffsets[activeSegIdx] ?? 0
    const segEnd   = segStart + (segments[activeSegIdx]?.text.length ?? 0)
    return chunks
      .filter((c) => c.start < segEnd && c.end > segStart)
      .map((c) => ({
        ...c,
        start: Math.max(0, c.start - segStart),
        end:   Math.min(segments[activeSegIdx].text.length, c.end - segStart),
      }))
  }, [chunks, activeSegIdx, segments, segmentOffsets])

  useEffect(() => {
    selectedSet.current = new Set(selectedWords)
    forceUpdate((n) => n + 1)
  }, [selectedWords])

  useEffect(() => { captionDelayRef.current = captionDelay }, [captionDelay])

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement) }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    function cleanup() {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      window.onYouTubeIframeAPIReady = () => {}
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null }
      if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null }
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id  = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function syncAnchor() {
    if (!playerRef.current) return
    anchorRef.current = { videoTime: playerRef.current.getCurrentTime(), wallTime: performance.now() }
  }

  function getInterpolatedTime(): number {
    const { videoTime, wallTime } = anchorRef.current
    if (!isPlayingRef.current) return videoTime
    return videoTime + (performance.now() - wallTime) / 1000
  }

  function initPlayer() {
    if (!playerDivRef.current || !window.YT?.Player) return
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null }
    playerRef.current = new window.YT.Player(playerDivRef.current, {
      videoId,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1, fs: 0, iv_load_policy: 3, cc_load_policy: 0 },
      events: {
        onReady: () => {
          intervalRef.current = setInterval(syncAnchor, 500)
          function tick() {
            const time = getInterpolatedTime() - captionDelayRef.current
            updateActiveRef.current(time)
            rafRef.current = requestAnimationFrame(tick)
          }
          rafRef.current = requestAnimationFrame(tick)
        },
        onStateChange: (e) => {
          isPlayingRef.current = e.data === 1
          syncAnchor()
        },
      },
    })
  }

  const updateActive = useCallback(
    (time: number) => {
      let nextSeg = -1
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (time >= seg.start && time < seg.start + seg.duration) { nextSeg = i; break }
      }
      if (nextSeg === -1 && holdRef.current.idx >= 0 && time < holdRef.current.until) {
        nextSeg = holdRef.current.idx
      } else if (nextSeg >= 0) {
        holdRef.current = { idx: nextSeg, until: segments[nextSeg].start + segments[nextSeg].duration + 0.25 }
      }
      setActiveSegIdx((prev) => (prev === nextSeg ? prev : nextSeg))
    },
    [segments],
  )

  useEffect(() => { updateActiveRef.current = updateActive }, [updateActive])

  function toggleWord(word: string) {
    const next = new Set(selectedSet.current)
    if (next.has(word)) next.delete(word)
    else next.add(word)
    selectedSet.current = next
    forceUpdate((n) => n + 1)
    onWordsChange(Array.from(next).sort())
  }

  function adjustDelay(delta: number) {
    setCaptionDelay((prev) => Math.min(20, Math.max(-20, Math.round((prev + delta) * 10) / 10)))
    setActiveSegIdx(-2)
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    document.fullscreenElement ? document.exitFullscreen() : containerRef.current.requestFullscreen()
  }

  const activeSeg = activeSegIdx >= 0 ? segments[activeSegIdx] : null

  // Subtitle: chunks as inline colored underlines, plain words individually clickable.
  // The overlay container provides the single dark background — no per-element boxes.
  function renderSubtitle(): React.ReactNode {
    if (!activeSeg || isNonSpeech(activeSeg.text)) return null
    const parts = splitByChunks(activeSeg.text, activeChunks)
    return parts.map((part, i) => {
      if (part.chunk) {
        const c = part.chunk
        const isSelected = selectedChunk?.text === c.text
        return (
          <span
            key={i}
            onClick={() => onChunkSelect?.(c)}
            title={c.contextual_translation}
            style={{
              cursor: 'pointer',
              pointerEvents: 'auto',
              borderBottom: `2.5px solid ${c.color}`,
              borderRadius: 2,
              paddingBottom: 1,
              background: isSelected ? c.color + '55' : 'transparent',
              color: '#1a1a1a',
              fontWeight: isSelected ? 900 : 700,
              transition: 'background 120ms ease',
            }}
          >
            {part.text}
          </span>
        )
      }
      return <span key={i}>{renderWords(part.text, String(i), selectedSet.current, toggleWord)}</span>
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Video — full width */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 24, background: 'rgba(255,250,240,0.78)', boxShadow: 'var(--shadow-md)', padding: 12 }}>
        <div ref={containerRef} className="yt-video-container">
          <div ref={playerDivRef} className="yt-player-div" />

          {/* Subtitle overlay: chunks + words */}
          {showCaptions && activeSeg && !isNonSpeech(activeSeg.text) && (
            <div className="subtitle-overlay">
              {renderSubtitle()}
            </div>
          )}

          {/* CC + fullscreen — bottom right */}
          <div className="subtitle-controls-bar" style={{ top: 'auto', bottom: 10 }}>
            <button
              onClick={() => setShowCaptions((c) => !c)}
              className={`btn-subtitle-ctrl${showCaptions ? ' on' : ''}`}
              title={showCaptions ? 'Hide subtitles' : 'Show subtitles'}
            >
              CC
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn-subtitle-ctrl"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        {/* Sync calibration */}
        <div style={{ padding: 14, border: '1px solid var(--line)', borderRadius: 22, background: 'rgba(255,250,240,0.72)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: 10 }}>
            <span>Sync calibration</span>
            <span>{captionDelay > 0 ? '+' : ''}{captionDelay.toFixed(1)}s</span>
          </div>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>
            If the subtitle appears before the words are spoken, click Delay. If it&apos;s late, click Earlier.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.7fr', gap: 8 }}>
            {['Delay +0.5s', 'Earlier -0.5s', 'Reset'].map((label, i) => (
              <button
                key={label}
                onClick={() => adjustDelay(i === 0 ? 0.5 : i === 1 ? -0.5 : -captionDelay)}
                style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '10px 12px', background: 'rgba(255,255,255,0.44)', color: 'var(--ink)', font: 'inherit', fontSize: '0.86rem', fontWeight: 900, cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Word collector */}
        <div style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 22, background: 'rgba(255,250,240,0.78)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: 10 }}>
            <span>Selected words</span>
            <span>{selectedSet.current.size}</span>
          </div>
          <div className="chip-list">
            {selectedSet.current.size === 0 ? (
              <span style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
                {chunks?.length ? 'Click chunks or words on the subtitle' : 'Click words on the subtitle to select them'}
              </span>
            ) : (
              Array.from(selectedSet.current).sort().map((word) => (
                <button key={word} className="chip" onClick={() => toggleWord(word)}>
                  {word} ×
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
