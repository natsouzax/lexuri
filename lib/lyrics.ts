export interface LrcLine {
  time: number
  text: string
}

export interface LyricsResult {
  title: string
  artist: string
  lrc_content: string | null
  plain_lyrics: string
  duration?: number
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

export async function searchLrcLib(query: string): Promise<LrcLibSearchHit[]> {
  try {
    const res = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return []
    return (await res.json()) as LrcLibSearchHit[]
  } catch {
    return []
  }
}

export async function fetchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
  // Primary: lrclib.net
  try {
    const url =
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const data = (await res.json()) as {
        trackName: string
        artistName: string
        syncedLyrics: string | null
        plainLyrics: string | null
        duration: number
      }
      const plain = data.plainLyrics ?? extractPlainFromLrc(data.syncedLyrics ?? '')
      if (plain.trim()) {
        return {
          title: data.trackName,
          artist: data.artistName,
          lrc_content: data.syncedLyrics ?? null,
          plain_lyrics: plain,
          duration: data.duration,
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: Happi.dev
  const happiKey = process.env.HAPPI_API_KEY
  if (happiKey) {
    try {
      const q = encodeURIComponent(`${artist} ${title}`)
      const searchRes = await fetch(
        `https://api.happi.dev/v1/music?q=${q}&apikey=${happiKey}&limit=3&type=track`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
          success: boolean
          result?: Array<{
            track: string
            artist: string
            id_artist: number
            id_album: number
            id_track: number
            api_lyrics: string
            haslyrics: boolean
          }>
        }
        const hit = searchData.result?.find((r) => r.haslyrics)
        if (hit) {
          const lyricRes = await fetch(
            `${hit.api_lyrics}?apikey=${happiKey}`,
            { signal: AbortSignal.timeout(8000) },
          )
          if (lyricRes.ok) {
            const lyricData = (await lyricRes.json()) as {
              success: boolean
              result?: { lyrics: string }
            }
            const lyrics = lyricData.result?.lyrics
            if (lyrics?.trim()) {
              return {
                title: hit.track,
                artist: hit.artist,
                lrc_content: null,
                plain_lyrics: lyrics,
              }
            }
          }
        }
      }
    } catch { /* fall through */ }
  }

  return null
}

export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []
  for (const raw of lrc.split('\n')) {
    const match = raw.match(/^\[(\d{1,2}):(\d{2}\.\d+)\](.*)$/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseFloat(match[2])
      lines.push({ time: minutes * 60 + seconds, text: match[3].trim() })
    }
  }
  return lines
}

function extractPlainFromLrc(lrc: string): string {
  return lrc
    .split('\n')
    .map((line) => line.replace(/^\[\d{1,2}:\d{2}\.\d+\]/, '').trim())
    .filter(Boolean)
    .join('\n')
}
