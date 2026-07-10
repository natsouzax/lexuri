'use client'

import { useEffect, useRef } from 'react'

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

interface Props {
  videoId: string
  onPositionChange?: (seconds: number) => void
  /** Total video duration, in seconds — used to estimate line timing for lyrics with no real sync data. */
  onDurationChange?: (seconds: number) => void
}

// Audio fallback for the Music workspace when no Spotify match exists —
// merge-lyrics already resolves a YouTube video for nearly every song
// (search or paste alike), so this lets the lyrics stay synced to *something*
// playable instead of falling back to a plain, unsynced list. Deliberately
// minimal: no captions overlay, no chunk highlighting, no fullscreen — the
// full synced-video studio experience stays exclusive to the YouTube page.
export default function YoutubeAudioSyncPlayer({ videoId, onPositionChange, onDurationChange }: Props) {
  const playerRef = useRef<YTPlayer | null>(null)
  const playerDivRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onPositionChangeRef = useRef(onPositionChange)
  const onDurationChangeRef = useRef(onDurationChange)
  onPositionChangeRef.current = onPositionChange
  onDurationChangeRef.current = onDurationChange

  useEffect(() => {
    function createPlayer() {
      if (!playerDivRef.current || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            const duration = playerRef.current?.getDuration() ?? 0
            if (duration > 0) onDurationChangeRef.current?.(duration)
          },
          onStateChange: (e) => {
            const isPlaying = window.YT?.PlayerState && e.data === window.YT.PlayerState.PLAYING
            if (isPlaying) {
              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  onPositionChangeRef.current?.(playerRef.current?.getCurrentTime() ?? 0)
                }, 500)
              }
            } else if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  return (
    <div style={{ width: '100%', aspectRatio: '16/9', maxHeight: 220, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      <div ref={playerDivRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
