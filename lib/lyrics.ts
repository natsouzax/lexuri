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

// ── Genius HTML parser (no external deps) ────────────────────────────────────
// Extracts text from <div data-lyrics-container="true"> elements by tracking
// HTML depth, converting <br> to newlines, stripping all other tags.

function parseGeniusHTML(html: string): string {
  const blocks: string[] = []
  let searchFrom = 0

  while (true) {
    const attrPos = html.indexOf('data-lyrics-container="true"', searchFrom)
    if (attrPos === -1) break

    const tagEnd = html.indexOf('>', attrPos)
    if (tagEnd === -1) break

    let depth = 1
    let content = ''
    let i = tagEnd + 1

    while (i < html.length && depth > 0) {
      if (html[i] !== '<') {
        content += html[i++]
        continue
      }

      const end = html.indexOf('>', i)
      if (end === -1) break

      const inner = html.slice(i + 1, end)
      const isClose = inner.startsWith('/')
      const tagName = inner.replace(/^\//, '').match(/^[a-zA-Z]+/)?.[0]?.toLowerCase() ?? ''

      if (tagName === 'br') {
        content += '\n'
      } else if (tagName === 'div') {
        if (!isClose) {
          depth++
        } else {
          depth--
          if (depth === 0) { i = end + 1; break }
          content += '\n'
        }
      }

      i = end + 1
    }

    const clean = content
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (clean) blocks.push(clean)
    searchFrom = tagEnd + 1
  }

  return blocks.join('\n\n')
}

export async function fetchLyricsFromGeniusPublic(artist: string, title: string): Promise<string | null> {
  const token = process.env.GENIUS_API_KEY
  if (!token) return null

  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(`https://api.genius.com/search?q=${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!searchRes.ok) return null

    const searchData = (await searchRes.json()) as {
      response: {
        hits: Array<{
          result: { url: string; title: string; primary_artist: { name: string } }
        }>
      }
    }

    const hit = searchData.response.hits[0]
    if (!hit) return null

    const pageRes = await fetch(hit.result.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!pageRes.ok) return null

    const html = await pageRes.text()
    const lyrics = parseGeniusHTML(html)
    return lyrics || null
  } catch {
    return null
  }
}

// ── Individual source fetchers (exported for parallel use in merge route) ─────

export async function fetchFromLrcLib(artist: string, title: string): Promise<LyricsResult | null> {
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
  return null
}

// Free lyrics API — no key required, large English catalogue
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

// ── Main entry point ──────────────────────────────────────────────────────────

export async function fetchLyrics(artist: string, title: string): Promise<LyricsResult | null> {
  // 1. lrclib.net — synced + plain, best case
  const lrcResult = await fetchFromLrcLib(artist, title)
  if (lrcResult) return lrcResult

  // 2. Genius — large human-curated database, no sync
  const geniusLyrics = await fetchLyricsFromGeniusPublic(artist, title)
  if (geniusLyrics) {
    return {
      title,
      artist,
      lrc_content: null,
      plain_lyrics: geniusLyrics,
    }
  }

  // 3. Happi.dev — last text-only resort
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

export function extractPlainFromLrc(lrc: string): string {
  const lines: string[] = []
  for (const raw of lrc.split('\n')) {
    const line = raw.trim()
    // Skip LRC metadata tags: [ti:...], [ar:...], [al:...], [by:...], [offset:...]
    if (/^\[[a-zA-Z]/.test(line)) continue
    // Timestamp lines — strip the [mm:ss.xx] prefix, keep empty strings as stanza breaks
    if (/^\[\d{1,2}:\d{2}[.:]\d+\]/.test(line)) {
      lines.push(line.replace(/^\[\d{1,2}:\d{2}[.:]\d+\]\s*/, ''))
    }
    // Lines with no timestamp (bare blank lines in some LRC files) — skip
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
