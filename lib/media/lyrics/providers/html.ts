// Shared HTML helpers for the lyrics scrapers (letras, cifraclub, genius).
// Internal to the lyrics module — other platform modules keep their own parsing.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function browserHeaders(referer: string): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': referer,
  }
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

// Walks the HTML from just after an element's opening tag, converting <br> and
// <p> boundaries to newlines and tracking <div> depth until the element closes.
// Returns the extracted text (entities decoded, excess blank lines collapsed).
export function extractElementText(html: string, contentStart: number): string {
  let depth = 1
  let content = ''
  let i = contentStart

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

  return decodeEntities(content).replace(/\n{3,}/g, '\n\n').trim()
}

// Finds the opening <div> that contains `marker` and extracts its text.
export function extractDivByMarker(html: string, marker: string): string {
  const pos = html.indexOf(marker)
  if (pos === -1) return ''

  const divStart = html.lastIndexOf('<div', pos)
  if (divStart === -1) return ''

  const tagEnd = html.indexOf('>', divStart)
  if (tagEnd === -1) return ''

  return extractElementText(html, tagEnd + 1)
}
