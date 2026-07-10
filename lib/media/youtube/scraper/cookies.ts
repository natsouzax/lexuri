// Convert YOUTUBE_COOKIES JSON array → "name=value; name2=value2" string for youtubei.js
export function buildCookieString(): string | undefined {
  let raw = process.env.YOUTUBE_COOKIES?.trim()
  if (!raw) return undefined

  if (raw.startsWith('YOUTUBE_COOKIES=')) raw = raw.slice('YOUTUBE_COOKIES='.length).trim()
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim()
  }

  if (!raw.startsWith('[')) return raw

  try {
    const cookies = JSON.parse(raw) as Array<{ name: string; value: string }>
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  } catch {
    return undefined
  }
}
