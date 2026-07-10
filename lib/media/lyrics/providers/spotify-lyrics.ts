// Spotify's internal color-lyrics endpoint (Musixmatch-backed, line-synced).
// This is a *lyrics* source, so it lives in the Lyrics module — the Spotify
// module only identifies tracks. The access token is injected via the
// SpotifyTokenSource interface, keeping the modules decoupled.

import { buildLrc, extractPlainFromLrc } from '../parser'
import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'
import type { TimedLine } from '../types'

export interface SpotifyTokenSource {
  getUserToken(userId: string): Promise<string | null>
}

export async function fetchSpotifyTimedLines(
  trackId: string,
  accessToken: string,
): Promise<TimedLine[] | null> {
  try {
    const res = await fetch(
      `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'app-platform': 'WebPlayer',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      lyrics?: {
        syncType?: string
        language?: string
        lines?: Array<{ startTimeMs: string; words: string; endTimeMs: string }>
      }
    }

    const lines = data.lyrics?.lines
    if (!lines?.length) return null

    return lines.map((l) => ({
      startTimeMs: parseInt(l.startTimeMs, 10),
      words: l.words,
      endTimeMs: parseInt(l.endTimeMs, 10),
    }))
  } catch {
    return null
  }
}

export function timedLinesToLrc(lines: TimedLine[]): string {
  return buildLrc(
    lines
      .filter((l) => l.words.trim() && l.words !== '♪')
      .map((l) => ({ time: l.startTimeMs / 1000, text: l.words })),
  )
}

export function createSpotifyLyricsProvider(tokens: SpotifyTokenSource): LyricsProvider {
  return {
    name: 'spotify',
    // Line-synced Musixmatch data — timing guarantees structure, skip the quality gate
    trusted: true,
    async fetch({ artist, title, spotifyTrackId, userId }) {
      if (!spotifyTrackId || !userId) return null

      const token = await tokens.getUserToken(userId)
      if (!token) return null

      const lines = await fetchSpotifyTimedLines(spotifyTrackId, token)
      if (!lines?.length) return null

      const lrc = timedLinesToLrc(lines)
      const plain = extractPlainFromLrc(lrc)
      if (!plain.trim()) return null

      return normalizedLyrics({ title, artist, plainLyrics: plain, syncedLrc: lrc, source: 'spotify' })
    },
  }
}
