'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptSegment } from '@/lib/types'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        options: {
          videoId: string
          playerVars?: Record<string, number>
          events?: { onReady?: () => void }
        },
      ) => YTPlayer
      PlayerState?: Record<string, number>
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  getCurrentTime(): number
  destroy(): void
}

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g

function normalizeWord(word: string): string {
  return word.replace(/[^A-Za-z']/g, '').toLowerCase().replace(/^'+|'+$/g, '')
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function isNonSpeech(text: string): boolean {
  const t = (text ?? '').trim()
  if (!t) return true
  if (/^\[[^\]]+\]$/.test(t)) return true
  if (!/[A-Za-z]/.test(t)) return true
  return false
}

interface Props {
  videoId: string
  segments: TranscriptSegment[]
  selectedWords: string[]
  onWordsChange: (words: string[]) => void
}

export default function YoutubeSyncPlayer({
  videoId,
  segments,
  selectedWords,
  onWordsChange,
}: Props) {
  const playerRef       = useRef<YTPlayer | null>(null)
  const playerDivRef    = useRef<HTMLDivElement>(null)
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const selectedSet     = useRef(new Set(selectedWords))
  const [, forceUpdate] = useState(0)
  const [captionDelay, setCaptionDelay] = useState(0)
  const [activeSegIdx, setActiveSegIdx] = useState(-1)
  const lastScrollRef   = useRef(0)
  const transcriptRef   = useRef<HTMLDivElement>(null)

  // Refs so the interval always reads the latest values without being recreated
  const captionDelayRef  = useRef(0)
  const updateActiveRef  = useRef<(t: number) => void>(() => {})

  useEffect(() => {
    selectedSet.current = new Set(selectedWords)
    forceUpdate((n) => n + 1)
  }, [selectedWords])

  useEffect(() => { captionDelayRef.current = captionDelay }, [captionDelay])

  // Load YouTube IFrame API once; always clean up on unmount
  useEffect(() => {
    function cleanup() {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      window.onYouTubeIframeAPIReady = () => {}
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function initPlayer() {
    if (!playerDivRef.current || !window.YT?.Player) return
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
    playerRef.current = new window.YT.Player(playerDivRef.current, {
      videoId,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1 },
      events: {
        onReady: () => {
          intervalRef.current = setInterval(() => {
            if (!playerRef.current) return
            const time = playerRef.current.getCurrentTime() - captionDelayRef.current
            updateActiveRef.current(time)
          }, 100)
        },
      },
    })
  }

  const updateActive = useCallback(
    (time: number) => {
      let nextSeg = -1

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (time >= seg.start && time < seg.start + seg.duration) {
          nextSeg = i
          break
        }
      }

      setActiveSegIdx((prev) => {
        if (prev !== nextSeg && nextSeg >= 0 && transcriptRef.current) {
          const now = Date.now()
          if (now - lastScrollRef.current > 700) {
            const el = transcriptRef.current.querySelector(`[data-seg="${nextSeg}"]`)
            el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
            lastScrollRef.current = now
          }
        }
        return nextSeg
      })
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
    setCaptionDelay((prev) => {
      const next = Math.round((prev + delta) * 10) / 10
      return Math.min(20, Math.max(-20, next))
    })
    setActiveSegIdx(-2)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, alignItems: 'start' }}>
      {/* Left column: player + controls + collector */}
      <div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 24, background: 'rgba(255,250,240,0.78)', boxShadow: 'var(--shadow-md)', padding: 12 }}>
          <div ref={playerDivRef} style={{ width: '100%', aspectRatio: '16/9', borderRadius: 18, overflow: 'hidden', background: '#101813' }} />
        </div>

        {/* Sync calibration */}
        <div style={{ marginTop: 14, padding: 14, border: '1px solid var(--line)', borderRadius: 22, background: 'rgba(255,250,240,0.72)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: 10 }}>
            <span>Sync calibration</span>
            <span>{captionDelay > 0 ? '+' : ''}{captionDelay.toFixed(1)}s</span>
          </div>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>
            If the box lights up before the words are spoken, click Delay. If it&apos;s late, click Earlier.
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
        <div style={{ marginTop: 14, padding: 16, border: '1px solid var(--line)', borderRadius: 22, background: 'rgba(255,250,240,0.78)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginBottom: 10 }}>
            <span>Selected words</span>
            <span>{selectedSet.current.size}</span>
          </div>
          <div className="chip-list">
            {selectedSet.current.size === 0 ? (
              <span style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>Click words in the transcript →</span>
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

      {/* Right column: transcript */}
      <div
        ref={transcriptRef}
        style={{ maxHeight: 720, overflowY: 'auto', padding: 14, border: '1px solid var(--line)', borderRadius: 24, background: 'rgba(255,250,240,0.78)', boxShadow: 'var(--shadow-md)', scrollBehavior: 'smooth' }}
      >
        {segments.map((seg, segIdx) => {
          const isActive  = segIdx === activeSegIdx
          const nonSpeech = isNonSpeech(seg.text)
          const parts: React.ReactNode[] = []
          let lastIdx = 0
          let wordCounter = 0

          const regex = new RegExp(WORD_RE.source, 'g')
          let match: RegExpExecArray | null
          while ((match = regex.exec(seg.text)) !== null) {
            if (match.index > lastIdx) parts.push(seg.text.slice(lastIdx, match.index))
            const word = match[0]
            const norm = normalizeWord(word)
            const isSelected = selectedSet.current.has(norm)
            const wc = wordCounter
            parts.push(
              <span
                key={`${segIdx}-${wc}`}
                onClick={nonSpeech ? undefined : () => toggleWord(norm)}
                style={{
                  display: 'inline-block',
                  margin: '0 1px',
                  padding: '2px 4px',
                  borderRadius: 8,
                  cursor: nonSpeech ? 'default' : 'pointer',
                  transition: 'background 100ms ease',
                  background: isSelected ? 'rgba(246,202,95,0.55)' : undefined,
                  fontWeight: isSelected ? 900 : undefined,
                  fontStyle: nonSpeech ? 'italic' : undefined,
                  pointerEvents: nonSpeech ? 'none' : undefined,
                }}
              >
                {word}
              </span>,
            )
            wordCounter++
            lastIdx = match.index + word.length
          }
          if (lastIdx < seg.text.length) parts.push(seg.text.slice(lastIdx))

          return (
            <div
              key={segIdx}
              data-seg={segIdx}
              style={{
                padding: 14,
                border: `1px solid ${isActive ? 'rgba(200,111,74,0.55)' : 'transparent'}`,
                borderRadius: 18,
                marginBottom: 10,
                lineHeight: 1.8,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(246,202,95,0.28), rgba(255,250,240,0.92))'
                  : 'rgba(255,255,255,0.36)',
                boxShadow: isActive ? '0 14px 34px rgba(200,111,74,0.14)' : undefined,
                transition: 'background 120ms ease, border 120ms ease, box-shadow 120ms ease',
              }}
            >
              <div style={{ display: 'inline-flex', marginBottom: 8, padding: '4px 8px', borderRadius: 999, background: 'rgba(24,33,29,0.08)', color: '#46624a', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em' }}>
                {formatTime(seg.start)}
              </div>
              <div>{parts}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
