import { decodeEntities } from './html'
import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'

const PAGE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

export interface GeniusHit {
  title: string
  artist: string
  url: string
}

export async function searchGenius(query: string): Promise<GeniusHit | null> {
  const token = process.env.GENIUS_API_KEY
  if (!token) return null

  try {
    const res = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null

    const data = (await res.json()) as {
      response?: {
        hits?: Array<{
          result?: { url?: string; title?: string; primary_artist?: { name?: string } }
        }>
      }
    }

    const first = data.response?.hits?.[0]?.result
    if (!first?.url) return null
    return {
      title: first.title ?? '',
      artist: first.primary_artist?.name ?? '',
      url: first.url,
    }
  } catch {
    return null
  }
}

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

    const clean = decodeEntities(content).replace(/\n{3,}/g, '\n\n').trim()
    if (clean) blocks.push(clean)
    searchFrom = tagEnd + 1
  }

  return blocks.join('\n\n')
}

export async function fetchLyricsFromGenius(artist: string, title: string): Promise<string | null> {
  const hit = await searchGenius(`${artist} ${title}`)
  if (!hit) return null
  return fetchLyricsFromGeniusUrl(hit.url)
}

export async function fetchLyricsFromGeniusUrl(url: string): Promise<string | null> {
  try {
    const pageRes = await fetch(url, {
      headers: PAGE_HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!pageRes.ok) return null

    const lyrics = parseGeniusHTML(await pageRes.text())
    return lyrics || null
  } catch {
    return null
  }
}

export const geniusProvider: LyricsProvider = {
  name: 'genius',
  async fetch({ artist, title }) {
    const plain = await fetchLyricsFromGenius(artist, title)
    if (!plain) return null
    return normalizedLyrics({ title, artist, plainLyrics: plain, source: 'genius' })
  },
}
