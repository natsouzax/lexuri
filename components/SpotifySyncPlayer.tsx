'use client'

import { useEffect, useRef } from 'react'

interface SpotifyPlaybackUpdate {
  data: { position: number; duration: number; isPaused: boolean }
}

interface SpotifyController {
  addListener(event: 'playback_update', cb: (e: SpotifyPlaybackUpdate) => void): void
  removeListener(event: 'playback_update'): void
  destroy(): void
}

interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: SpotifyController) => void,
  ): void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void
    SpotifyIframeApi?: SpotifyIFrameAPI
  }
}

// The Spotify script only fires window.onSpotifyIframeApiReady once per page
// load — cache the resolved API in module scope so remounts (switching songs)
// don't need a second script load/callback.
let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null

function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (spotifyApiPromise) return spotifyApiPromise
  spotifyApiPromise = new Promise((resolve) => {
    if (window.SpotifyIframeApi) { resolve(window.SpotifyIframeApi); return }
    window.onSpotifyIframeApiReady = (api) => {
      window.SpotifyIframeApi = api
      resolve(api)
    }
    if (!document.getElementById('spotify-iframe-api')) {
      const script = document.createElement('script')
      script.id = 'spotify-iframe-api'
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      document.head.appendChild(script)
    }
  })
  return spotifyApiPromise
}

const UNAVAILABLE_TIMEOUT_MS = 8000

interface Props {
  trackId: string
  onPositionChange?: (seconds: number) => void
  /** Total track duration, in seconds — used to estimate line timing for lyrics with no real sync data. */
  onDurationChange?: (seconds: number) => void
  /** Called if no playback_update arrives within a few seconds (blocked script, no network, etc.) — the caller should fall back to an unsynced view. */
  onUnavailable?: () => void
  height?: number
}

export default function SpotifySyncPlayer({ trackId, onPositionChange, onDurationChange, onUnavailable, height = 152 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onPositionChangeRef = useRef(onPositionChange)
  const onDurationChangeRef = useRef(onDurationChange)
  const onUnavailableRef = useRef(onUnavailable)
  onPositionChangeRef.current = onPositionChange
  onDurationChangeRef.current = onDurationChange
  onUnavailableRef.current = onUnavailable

  useEffect(() => {
    let cancelled = false
    let controller: SpotifyController | null = null
    const timeoutId = setTimeout(() => onUnavailableRef.current?.(), UNAVAILABLE_TIMEOUT_MS)

    loadSpotifyIframeApi().then((api) => {
      if (cancelled || !containerRef.current) return
      api.createController(
        containerRef.current,
        { uri: `spotify:track:${trackId}`, width: '100%', height },
        (c) => {
          if (cancelled) { c.destroy(); return }
          controller = c
          c.addListener('playback_update', (e) => {
            clearTimeout(timeoutId)
            onPositionChangeRef.current?.(e.data.position / 1000)
            if (e.data.duration > 0) onDurationChangeRef.current?.(e.data.duration / 1000)
          })
        },
      )
    })

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      controller?.destroy()
    }
  }, [trackId, height])

  return <div ref={containerRef} />
}
