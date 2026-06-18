function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': 'https://www.cifraclub.com.br/',
}

function parseCifraHTML(html: string): string {
  // Try multiple selectors used by Cifra Club for lyrics
  const markers = [
    'class="lyric"',
    'id="cifra_lyric"',
    'class="lyric-content"',
  ]

  for (const marker of markers) {
    const pos = html.indexOf(marker)
    if (pos === -1) continue

    const divStart = html.lastIndexOf('<div', pos)
    if (divStart === -1) continue

    const tagEnd = html.indexOf('>', divStart)
    if (tagEnd === -1) continue

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

      const inner = html.slice(i + 1, end).trim()
      const isClose = inner.startsWith('/')
      const tagName = inner.replace(/^\//, '').match(/^[a-zA-Z]+/)?.[0]?.toLowerCase() ?? ''

      if (tagName === 'br') {
        content += '\n'
      } else if (tagName === 'p') {
        if (!isClose) content += '\n'
      } else if (tagName === 'div') {
        if (!isClose) depth++
        else {
          depth--
          if (depth === 0) break
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

    if (clean.length > 50) return clean
  }

  return ''
}

function extractFirstLetrasHref(html: string): string | null {
  // Search results for "type=letters" have links like /artist/song/
  const pos = html.indexOf('/busca/')
  if (pos !== -1) {
    // Skip the search URL itself, look for song hrefs in results
  }

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
  try {
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 300))

    const q = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(
      `https://www.cifraclub.com.br/busca/?q=${q}&type=letters`,
      {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(10000),
      },
    )
    if (!searchRes.ok) return null

    const searchHtml = await searchRes.text()
    const href = extractFirstLetrasHref(searchHtml)
    if (!href) return null

    const songRes = await fetch(`https://www.cifraclub.com.br${href}letra/`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!songRes.ok) return null

    const songHtml = await songRes.text()
    const lyrics = parseCifraHTML(songHtml)
    return lyrics || null
  } catch {
    return null
  }
}
