import { browserHeaders, extractDivByMarker, slugify } from './html'
import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'

const HEADERS = browserHeaders('https://www.letras.mus.br/')

function parseLetrasHTML(html: string): string {
  // Target: <div class="lyric-original"><p>...</p></div>
  return extractDivByMarker(html, 'lyric-original')
}

function extractFirstSearchHref(html: string): string | null {
  // <ul class="js-search-list"> contains <li><a href="/artist/song/">
  const listPos = html.indexOf('js-search-list')
  if (listPos === -1) return null

  const hrefPos = html.indexOf('href="/', listPos)
  if (hrefPos === -1) return null

  const hrefEnd = html.indexOf('"', hrefPos + 6)
  if (hrefEnd === -1) return null

  return html.slice(hrefPos + 6, hrefEnd) // e.g. "/coldplay/yellow/"
}

export async function scrapeLetras(artist: string, title: string): Promise<string | null> {
  // Primary: direct slug URL — song pages render without JS, only search is SPA
  try {
    const songRes = await fetch(
      `https://www.letras.mus.br/${slugify(artist)}/${slugify(title)}/`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    )
    if (songRes.ok) {
      const lyrics = parseLetrasHTML(await songRes.text())
      if (lyrics) return lyrics
    }
  } catch { /* fall through */ }

  // Fallback: search-based (works when the slug doesn't match exactly)
  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(`https://www.letras.mus.br/busca/?q=${q}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!searchRes.ok) return null
    const href = extractFirstSearchHref(await searchRes.text())
    if (!href) return null
    const songRes2 = await fetch(`https://www.letras.mus.br${href}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!songRes2.ok) return null
    return parseLetrasHTML(await songRes2.text()) || null
  } catch {
    return null
  }
}

export const letrasProvider: LyricsProvider = {
  name: 'letras',
  async fetch({ artist, title }) {
    const plain = await scrapeLetras(artist, title)
    if (!plain) return null
    return normalizedLyrics({ title, artist, plainLyrics: plain, source: 'letras' })
  },
}
