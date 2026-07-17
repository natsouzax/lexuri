import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'

// Free lyrics API — no key required, large English catalogue, plain text only.
export async function fetchFromLyricsOvh(artist: string, title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (res.ok) {
      const data = (await res.json()) as { lyrics?: string; error?: string }
      if (!data.error && data.lyrics?.trim()) return data.lyrics.trim()
    }
  } catch { /* fall through */ }
  return null
}

export const lyricsOvhProvider: LyricsProvider = {
  name: 'lyricsovh',
  async fetch({ artist, title }) {
    const plain = await fetchFromLyricsOvh(artist, title)
    if (!plain) return null
    return normalizedLyrics({ title, artist, plainLyrics: plain, source: 'lyricsovh' })
  },
}
