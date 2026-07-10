import { browserHeaders, extractDivByMarker, slugify } from './html'
import { normalizedLyrics } from './base'
import type { LyricsProvider } from './types'

const HEADERS = browserHeaders('https://www.cifraclub.com.br/')

function parseCifraHTML(html: string): string {
  // Try multiple selectors used by Cifra Club for lyrics
  const markers = ['class="lyric"', 'id="cifra_lyric"', 'class="lyric-content"']

  for (const marker of markers) {
    const clean = extractDivByMarker(html, marker)
    if (clean.length > 50) return clean
  }

  return ''
}

function extractFirstLetrasHref(html: string): string | null {
  // Look for the pattern: href="/artist-name/song-name/"
  const results = html.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9-]+\/)"/g)
  for (const match of results) {
    const href = match[1]
    // Skip navigation / generic links
    if (href.startsWith('/busca') || href.startsWith('/top') || href === '/') continue
    if (href.split('/').filter(Boolean).length === 2) return href
  }
  return null
}

export async function scrapeCifraClub(artist: string, title: string): Promise<string | null> {
  // Primary: direct slug URL — song pages render without JS, only search is SPA
  try {
    const songRes = await fetch(
      `https://www.cifraclub.com.br/${slugify(artist)}/${slugify(title)}/letra/`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    )
    if (songRes.ok) {
      const lyrics = parseCifraHTML(await songRes.text())
      if (lyrics) return lyrics
    }
  } catch { /* fall through */ }

  // Fallback: search-based (works when the slug doesn't match exactly)
  try {
    await new Promise(r => setTimeout(r, 300))
    const q = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(
      `https://www.cifraclub.com.br/busca/?q=${q}&type=letters`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    )
    if (!searchRes.ok) return null
    const href = extractFirstLetrasHref(await searchRes.text())
    if (!href) return null
    const songRes2 = await fetch(
      `https://www.cifraclub.com.br${href}letra/`,
      { headers: HEADERS, signal: AbortSignal.timeout(10000) },
    )
    if (!songRes2.ok) return null
    return parseCifraHTML(await songRes2.text()) || null
  } catch {
    return null
  }
}

export const cifraClubProvider: LyricsProvider = {
  name: 'cifraclub',
  async fetch({ artist, title }) {
    const plain = await scrapeCifraClub(artist, title)
    if (!plain) return null
    return normalizedLyrics({ title, artist, plainLyrics: plain, source: 'cifraclub' })
  },
}
