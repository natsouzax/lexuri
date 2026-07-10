import { extractPlainFromLrc } from '../parser'
import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'
import type { LrcLibSearchHit, NormalizedLyrics } from '../types'

const BASE_URL = 'https://lrclib.net/api'
const TIMEOUT_MS = 8000

interface LrcLibTrack {
  trackName?: string
  artistName?: string
  albumName?: string
  duration?: number
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

function toNormalized(data: LrcLibTrack, fallbackArtist: string, fallbackTitle: string, source: string): NormalizedLyrics | null {
  const plain = data.plainLyrics ?? extractPlainFromLrc(data.syncedLyrics ?? '')
  if (!plain?.trim()) return null
  return normalizedLyrics({
    title: data.trackName ?? fallbackTitle,
    artist: data.artistName ?? fallbackArtist,
    album: data.albumName,
    durationSec: data.duration,
    plainLyrics: plain,
    syncedLrc: data.syncedLyrics ?? null,
    source,
  })
}

export async function fetchFromLrcLib(artist: string, title: string): Promise<NormalizedLyrics | null> {
  try {
    const url =
      `${BASE_URL}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null
    return toNormalized((await res.json()) as LrcLibTrack, artist, title, 'lrclib')
  } catch {
    return null
  }
}

export async function searchLrcLib(query: string): Promise<LrcLibSearchHit[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    )
    if (!res.ok) return []
    return (await res.json()) as LrcLibSearchHit[]
  } catch {
    return []
  }
}

/** Exact artist+title lookup — the primary lyrics provider. */
export const lrcLibProvider: LyricsProvider = {
  name: 'lrclib',
  fetch: ({ artist, title }) => fetchFromLrcLib(artist, title),
}

/** Search-based fallback for exact-name mismatches (e.g. "feat." variants). */
export const lrcLibSearchProvider: LyricsProvider = {
  name: 'lrclib_search',
  async fetch({ artist, title }) {
    const hits = await searchLrcLib(`${artist} ${title}`)
    const best = hits.find(h => h.syncedLyrics) ?? hits[0]
    if (!best) return null
    return toNormalized(best, artist, title, 'lrclib_search')
  },
}
