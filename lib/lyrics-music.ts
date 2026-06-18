import { assessLyricsQuality } from './lyrics-quality'
import { getMusicCaptions, extractVideoId } from './youtube'
import { scrapeLetras } from './scrapers/letras'
import { scrapeCifraClub } from './scrapers/cifraclub'
import { fetchLyricsFromGeniusPublic } from './lyrics'
import { getSpotifyLyrics, getUserAccessToken } from './spotify'
import { extractPlainFromLrc } from './lyrics'

export interface MusicLyricsResult {
  title: string
  artist: string
  plain_lyrics: string
  lrc_content: string | null
  verified: boolean
  source: string
}

// Convert Spotify Musixmatch lines → LRC string
function spotifyLinesToLrc(lines: Array<{ startTimeMs: number; words: string }>): string {
  return lines
    .filter(l => l.words.trim() && l.words !== '♪')
    .map(l => {
      const ms = l.startTimeMs
      const totalSec = ms / 1000
      const min = Math.floor(totalSec / 60)
      const sec = (totalSec % 60).toFixed(2).padStart(5, '0')
      return `[${String(min).padStart(2, '0')}:${sec}] ${l.words}`
    })
    .join('\n')
}

export async function getMusicLyrics(
  artist: string,
  title: string,
  opts: {
    youtubeVideoId?: string | null
    spotifyTrackId?: string | null
    userId?: string | null
  } = {},
): Promise<MusicLyricsResult> {
  const fallback: MusicLyricsResult = {
    title,
    artist,
    plain_lyrics: '',
    lrc_content: null,
    verified: false,
    source: 'none',
  }

  // ── 1. lrclib.net ─────────────────────────────────────────────────────────────
  try {
    const url =
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = (await res.json()) as {
        trackName?: string
        artistName?: string
        syncedLyrics?: string | null
        plainLyrics?: string | null
      }
      const plain = data.plainLyrics ?? extractPlainFromLrc(data.syncedLyrics ?? '')
      if (plain?.trim()) {
        const { quality } = assessLyricsQuality(plain, data.syncedLyrics)
        if (quality !== 'unverified') {
          return {
            title: data.trackName ?? title,
            artist: data.artistName ?? artist,
            plain_lyrics: plain,
            lrc_content: data.syncedLyrics ?? null,
            verified: true,
            source: 'lrclib',
          }
        }
      }
    }
  } catch { /* fall through */ }

  // ── 2. YouTube strict (only ♪ or human-captioned tracks) ─────────────────────
  if (opts.youtubeVideoId) {
    const segments = await getMusicCaptions(opts.youtubeVideoId)
    if (segments?.length) {
      const plain = segments.map(s => s.text).join('\n')
      const { quality } = assessLyricsQuality(plain)
      if (quality !== 'unverified') {
        return {
          title,
          artist,
          plain_lyrics: plain,
          lrc_content: null,
          verified: true,
          source: 'youtube_strict',
        }
      }
    }
  } else if (opts.youtubeVideoId === undefined) {
    // Try extracting video ID from a search — not done here, caller must supply it
  }

  // ── 3. Spotify Musixmatch (line-synced, requires user OAuth) ─────────────────
  if (opts.spotifyTrackId && opts.userId) {
    try {
      const token = await getUserAccessToken(opts.userId)
      if (token) {
        const lines = await getSpotifyLyrics(opts.spotifyTrackId, token)
        if (lines?.length) {
          const lrc = spotifyLinesToLrc(lines)
          const plain = extractPlainFromLrc(lrc)
          if (plain.trim()) {
            return {
              title,
              artist,
              plain_lyrics: plain,
              lrc_content: lrc,
              verified: true,
              source: 'spotify',
            }
          }
        }
      }
    } catch { /* fall through */ }
  }

  // ── 4. Letras.mus.br ──────────────────────────────────────────────────────────
  const letras = await scrapeLetras(artist, title)
  if (letras) {
    const { quality } = assessLyricsQuality(letras)
    if (quality !== 'unverified') {
      return {
        title,
        artist,
        plain_lyrics: letras,
        lrc_content: null,
        verified: true,
        source: 'letras',
      }
    }
  }

  // ── 5. Genius ─────────────────────────────────────────────────────────────────
  const genius = await fetchLyricsFromGeniusPublic(artist, title)
  if (genius) {
    const { quality } = assessLyricsQuality(genius)
    if (quality !== 'unverified') {
      return {
        title,
        artist,
        plain_lyrics: genius,
        lrc_content: null,
        verified: true,
        source: 'genius',
      }
    }
  }

  // ── 6. Cifra Club ─────────────────────────────────────────────────────────────
  const cifra = await scrapeCifraClub(artist, title)
  if (cifra) {
    const { quality } = assessLyricsQuality(cifra)
    if (quality !== 'unverified') {
      return {
        title,
        artist,
        plain_lyrics: cifra,
        lrc_content: null,
        verified: true,
        source: 'cifraclub',
      }
    }
  }

  // ── Nothing passed quality check ──────────────────────────────────────────────
  // Return whatever we found (even unverified) with verified: false so the
  // frontend can show the warning card/modal
  const bestPlain = letras ?? genius ?? cifra ?? ''
  return { ...fallback, plain_lyrics: bestPlain, verified: false }
}
