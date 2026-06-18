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
  'Referer': 'https://www.letras.mus.br/',
}

function parseLetrasHTML(html: string): string {
  // Target: <div class="lyric-original"><p>...</p></div>
  const markerOpen = 'lyric-original'
  const pos = html.indexOf(markerOpen)
  if (pos === -1) return ''

  const divStart = html.lastIndexOf('<div', pos)
  if (divStart === -1) return ''

  const tagEnd = html.indexOf('>', divStart)
  if (tagEnd === -1) return ''

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

  return content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  try {
    const q = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(`https://www.letras.mus.br/busca/?q=${q}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!searchRes.ok) return null

    const searchHtml = await searchRes.text()
    const href = extractFirstSearchHref(searchHtml)
    if (!href) return null

    const songRes = await fetch(`https://www.letras.mus.br${href}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!songRes.ok) return null

    const songHtml = await songRes.text()
    const lyrics = parseLetrasHTML(songHtml)
    return lyrics || null
  } catch {
    return null
  }
}
