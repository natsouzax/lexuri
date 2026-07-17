const PAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// Update this when YouTube starts rejecting the client version
const INNERTUBE_CLIENT_VERSION = '20.10.38'
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'x-yt-cookie',
      ...(init.headers ?? {}),
    },
  })
}

function extractCaptionTracks(html) {
  const marker = '"captionTracks":'
  const pos = html.indexOf(marker)
  if (pos === -1) return null

  const arrayStart = pos + marker.length
  if (html[arrayStart] !== '[') return null

  let depth = 0
  let i = arrayStart
  for (; i < html.length; i++) {
    if (html[i] === '[' || html[i] === '{') depth++
    else if (html[i] === ']' || html[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }

  try {
    return JSON.parse(html.slice(arrayStart, i + 1))
  } catch {
    return null
  }
}

function buildCookieString(raw) {
  raw = raw?.trim()
  if (!raw) return ''

  if (raw.startsWith('YOUTUBE_COOKIES=')) raw = raw.slice('YOUTUBE_COOKIES='.length).trim()
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim()
  }

  if (!raw.startsWith('[')) return raw

  try {
    return JSON.parse(raw).map((c) => `${c.name}=${c.value}`).join('; ')
  } catch {
    return ''
  }
}

// Use json3 format — structured JSON, much more reliable than regex XML parsing
async function fetchCaptionTrack(track, headers) {
  const captionUrl = new URL(track.baseUrl)
  if (!captionUrl.hostname.endsWith('.youtube.com')) throw new Error('Invalid caption host')
  captionUrl.searchParams.set('fmt', 'json3')

  const res = await fetch(captionUrl.toString(), {
    headers,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Caption fetch ${res.status}`)

  const data = await res.json()
  const segments = (data.events ?? [])
    .filter((e) => e.segs?.length && e.tStartMs !== undefined)
    .map((e) => ({
      text: e.segs.map((s) => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim(),
      start: (e.tStartMs ?? 0) / 1000,
      duration: Math.max(0.1, (e.dDurationMs ?? 2000) / 1000),
    }))
    .filter((s) => s.text)

  if (!segments.length) throw new Error('Empty caption segments')
  return segments
}

function pickTrack(tracks) {
  const enHuman = tracks.find((t) => t.languageCode === 'en' && t.kind !== 'asr')
  const enAsr = tracks.find((t) => t.languageCode === 'en')
  const enAny = tracks.find((t) => t.languageCode?.startsWith('en'))
  const best = enHuman ?? enAsr ?? enAny ?? tracks[0]
  return { best, isASR: best.kind === 'asr' || (!enHuman && !!enAsr) }
}

async function fetchViaInnerTube(videoId, cookie) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': INNERTUBE_USER_AGENT,
  }
  if (cookie) headers.Cookie = cookie

  const res = await fetch(INNERTUBE_API_URL, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(12000),
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: INNERTUBE_CLIENT_VERSION,
          androidSdkVersion: 34,
          platform: 'MOBILE',
        },
      },
      videoId,
    }),
  })

  if (!res.ok) throw new Error(`InnerTube ${res.status}`)

  const data = await res.json()
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  if (!tracks?.length) throw new Error('No caption tracks found via InnerTube')

  const { best, isASR } = pickTrack(tracks)
  const captHeaders = {
    'User-Agent': PAGE_HEADERS['User-Agent'],
    'Accept-Language': PAGE_HEADERS['Accept-Language'],
    ...(cookie ? { Cookie: cookie } : {}),
  }
  const segments = await fetchCaptionTrack(best, captHeaders)
  return { segments, isASR }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({}, { status: 204 })

    const url = new URL(request.url)
    const videoId = url.searchParams.get('videoId')
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return json({ error: 'Invalid videoId' }, { status: 400 })
    }

    const cookie = request.headers.get('x-yt-cookie') || buildCookieString(env.YOUTUBE_COOKIES)
    const pageHeaders = { ...PAGE_HEADERS, ...(cookie ? { Cookie: cookie } : {}) }

    // Strategy 1: InnerTube Android API (most reliable, no HTML scraping)
    let innerTubeError = ''
    try {
      const data = await fetchViaInnerTube(videoId, cookie)
      return json({
        ...data,
        hasMusicalSymbol: data.segments.some((s) => s.text.includes('♪') || s.text.includes('🎵')),
      })
    } catch (e) {
      innerTubeError = String(e)
    }

    // Strategy 2: Scrape the watch page for captionTracks
    let html
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
        headers: pageHeaders,
        signal: AbortSignal.timeout(15000),
      })
      if (!pageRes.ok) return json({ error: `YouTube page ${pageRes.status}` }, { status: pageRes.status })
      html = await pageRes.text()
    } catch (e) {
      return json({ error: `Page fetch failed: ${String(e)}`, innerTubeError }, { status: 502 })
    }

    const tracks = extractCaptionTracks(html)
    if (!tracks?.length) {
      return json({ error: 'No caption tracks found', innerTubeError, cookiePresent: !!cookie }, { status: 422 })
    }

    const { best, isASR } = pickTrack(tracks)
    let segments
    try {
      segments = await fetchCaptionTrack(best, pageHeaders)
    } catch (e) {
      return json({ error: `Caption fetch failed: ${String(e)}` }, { status: 502 })
    }

    return json({
      segments,
      isASR,
      hasMusicalSymbol: segments.some((s) => s.text.includes('♪') || s.text.includes('🎵')),
    })
  },
}
