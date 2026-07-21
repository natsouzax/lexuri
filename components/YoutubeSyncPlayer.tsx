'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChunkItem, Flashcard, TranscriptSegment } from '@/lib/types'
import { useWordHoverSave } from '@/hooks/useWordHoverSave'
import WordHoverTooltip from '@/components/WordHoverTooltip'

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
  getDuration(): number
  destroy(): void
}

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g
const IMPORTANCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

interface ChunkTooltipState {
  chunk: ChunkItem
  x: number
  y: number
}

function formatChunkType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function speakChunkText(t: string, e: React.MouseEvent) {
  e.stopPropagation()
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(t)
  u.lang = 'en-US'
  window.speechSynthesis.speak(u)
}

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

// Render plain text as individually hoverable/clickable words. Hovering a
// word previews its translation (see WordTooltipState); clicking saves it
// as a flashcard immediately using whatever the hover already fetched.
function renderWords(
  text: string,
  keyPrefix: string,
  savedWords: Set<string>,
  savingWord: string | null,
  onHover: (word: string, context: string, rect: DOMRect) => void,
  onLeave: () => void,
  onClick: (word: string, context: string) => void,
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
    const isSaved = savedWords.has(norm)
    const isSaving = savingWord === norm
    parts.push(
      <span
        key={`${keyPrefix}-w${wc++}`}
        onMouseEnter={(e) => onHover(norm, text, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={onLeave}
        onClick={() => !isSaved && !isSaving && onClick(norm, text)}
        style={{
          cursor: isSaved ? 'default' : 'pointer',
          pointerEvents: 'auto',
          borderRadius: 4,
          padding: isSaved ? '1px 4px' : undefined,
          background: isSaved ? 'rgba(120,190,120,0.9)' : undefined,
          color: '#1a1a1a',
          fontWeight: isSaved ? 900 : undefined,
          opacity: isSaving ? 0.5 : 1,
          transition: 'background 100ms ease, opacity 100ms ease',
        }}
      >
        {word}{isSaved ? ' ✓' : ''}
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
  chunks?: ChunkItem[]
  selectedChunk?: ChunkItem | null
  onChunkSelect?: (chunk: ChunkItem) => void
  /** Called right after a word is saved as a flashcard from the caption overlay. */
  onWordSaved?: (card: Flashcard) => void
}

export default function YoutubeSyncPlayer({
  videoId,
  segments,
  chunks,
  selectedChunk,
  onChunkSelect,
  onWordSaved,
}: Props) {
  const playerRef        = useRef<YTPlayer | null>(null)
  const playerDivRef     = useRef<HTMLDivElement>(null)
  const containerRef     = useRef<HTMLDivElement>(null)
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef           = useRef<number | null>(null)
  const anchorRef        = useRef({ videoTime: 0, wallTime: 0 })
  const isPlayingRef     = useRef(false)
  const holdRef          = useRef({ idx: -1, until: 0 })
  const [captionDelay, setCaptionDelay] = useState(0)
  const [activeSegIdx, setActiveSegIdx] = useState(-1)
  const [showCaptions, setShowCaptions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chunkTooltip, setChunkTooltip] = useState<ChunkTooltipState | null>(null)
  const chunkHideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const captionDelayRef  = useRef(0)
  const updateActiveRef  = useRef<(t: number) => void>(() => {})

  // Hover-to-translate + click-to-save-flashcard, shared with SyncedLyricsList
  const { tooltip, savedWords, savingWord, onHover, onLeave, onWordClick, cancelHide, hideNow } =
    useWordHoverSave(videoId, onWordSaved)

  // New lesson — the manual A/V delay calibration was for the PREVIOUS video's
  // caption offset quirks, don't carry it over.
  useEffect(() => {
    setCaptionDelay(0)
    setActiveSegIdx(-1)
  }, [videoId])

  // The caption line advances on its own while the video plays — if a chunk/word
  // is being hovered when that happens, its DOM node gets replaced without ever
  // firing a real mouseleave, so the tooltip would otherwise stay stuck on screen
  // showing stale content. Clear both whenever the active line changes.
  useEffect(() => {
    clearTimeout(chunkHideTimerRef.current)
    setChunkTooltip(null)
    hideNow()
  }, [activeSegIdx, hideNow])

  // Pre-compute each segment's start offset in the full transcript (segments joined by '\n').
  // Adding 1 per segment for the single-char separator, same as join('\n').
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

  useEffect(() => { captionDelayRef.current = captionDelay }, [captionDelay])

  useEffect(() => {
    function onFsChange() {
      const doc = document as Document & { webkitFullscreenElement?: Element }
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
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
    // Re-run whenever the lesson changes — without this, navigating between
    // lessons client-side (no full page reload) kept the OLD video loaded in
    // the player while the captions/chunks below already updated to the new
    // lesson, making every "next" lesson look completely out of sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

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
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1, fs: 1, iv_load_policy: 3, cc_load_policy: 0 },
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

  function adjustDelay(delta: number) {
    setCaptionDelay((prev) => Math.min(20, Math.max(-20, Math.round((prev + delta) * 10) / 10)))
    setActiveSegIdx(-2)
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    const doc = document as Document & {
      webkitFullscreenElement?: Element
      webkitExitFullscreen?: () => void
    }
    const el = containerRef.current as HTMLElement & {
      webkitRequestFullscreen?: () => void
    }
    const isFs = !!(document.fullscreenElement || doc.webkitFullscreenElement)
    if (isFs) {
      ;(document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document)
    } else {
      ;(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
    }
  }

  const activeSeg = activeSegIdx >= 0 ? segments[activeSegIdx] : null

  // Subtitle: chunks as inline colored underlines, plain words hoverable/clickable.
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
            onMouseEnter={(e) => {
              clearTimeout(chunkHideTimerRef.current)
              const rect = e.currentTarget.getBoundingClientRect()
              setChunkTooltip({ chunk: c, x: rect.left + rect.width / 2, y: rect.top })
            }}
            onMouseLeave={() => {
              chunkHideTimerRef.current = setTimeout(() => setChunkTooltip(null), 160)
            }}
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
      return (
        <span key={i}>
          {renderWords(part.text, String(i), savedWords, savingWord, onHover, onLeave, onWordClick)}
        </span>
      )
    })
  }

  return (
    <div className="yt-sync-wrapper">
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

          {/* Tooltips render INSIDE the fullscreen container — the browser's Fullscreen API only paints
              descendants of the fullscreened element, so anything outside it (even position: fixed) goes invisible. */}
          <WordHoverTooltip tooltip={tooltip} onMouseEnter={cancelHide} onMouseLeave={hideNow} compact />

          {chunkTooltip && (
            <div
              className="chunk-tooltip-fixed"
              style={{ left: chunkTooltip.x, top: chunkTooltip.y - 10 }}
              onMouseEnter={() => clearTimeout(chunkHideTimerRef.current)}
              onMouseLeave={() => setChunkTooltip(null)}
            >
              <div className="chunk-tooltip-header">
                <span className="chunk-type-badge" style={{ color: chunkTooltip.chunk.color }}>
                  {formatChunkType(chunkTooltip.chunk.type)}
                </span>
                <button
                  className="chunk-speak-btn"
                  onClick={(e) => speakChunkText(chunkTooltip.chunk.text, e)}
                  aria-label="Listen"
                >
                  🔊
                </button>
              </div>
              <span className="chunk-tooltip-meaning">{chunkTooltip.chunk.contextual_translation}</span>
              {chunkTooltip.chunk.why_it_matters && (
                <span className="chunk-tooltip-example">{chunkTooltip.chunk.why_it_matters}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="yt-controls-row">
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
      </div>
    </div>
  )
}
