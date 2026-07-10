// Internal lyrics model — every provider normalizes its response to these types.
// The rest of the app never sees a provider-specific payload.
// This file must stay type-only so client components can `import type` from it.

import type { LrcLine } from './parser'

export interface LyricsQuery {
  artist: string
  title: string
  album?: string
  durationSec?: number
  spotifyTrackId?: string | null
  youtubeVideoId?: string | null
  userId?: string | null
}

export interface NormalizedLyrics {
  title: string
  artist: string
  album?: string
  durationSec?: number
  language?: string
  plainLyrics: string
  /** Synced lyrics in LRC format, null when the source has no timing data. */
  syncedLrc: string | null
  /** Parsed timestamps from syncedLrc (empty when not synced). */
  lines: LrcLine[]
  source: string
  verified: boolean
}

/** Line-synced lyrics as raw millisecond timings (provider-neutral). */
export interface TimedLine {
  startTimeMs: number
  endTimeMs: number
  words: string
}

export interface LrcLibSearchHit {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  syncedLyrics: string | null
  plainLyrics: string | null
}
