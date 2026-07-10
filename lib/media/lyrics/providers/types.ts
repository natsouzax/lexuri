import type { LyricsQuery, NormalizedLyrics } from '../types'

// Every lyrics source implements this interface and returns the internal
// NormalizedLyrics model — the service (and the rest of the app) never sees
// a provider-specific payload.
export interface LyricsProvider {
  readonly name: string
  /** Trusted providers bypass the service-level quality gate (e.g. Spotify line-synced). */
  readonly trusted?: boolean
  fetch(query: LyricsQuery): Promise<NormalizedLyrics | null>
}
