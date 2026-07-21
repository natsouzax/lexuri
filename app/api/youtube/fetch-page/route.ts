// Runs on Cloudflare Edge — different IP space from Vercel Lambda (AWS).
// YouTube does not block Cloudflare IPs, so this bypasses the datacenter block
// that prevents Lambda functions from fetching YouTube transcripts directly.
export const runtime = 'edge'

interface CaptionTrack {
  baseUrl: string
  languageCode: string
  kind?: string
  name?: { simpleText?: string }
}

interface SegmentOut {
  text: string
  start: number
  duration: number
}

function extractCaptionTracks(html: string): CaptionTrack[] | null {
  const marker = '"captionTracks":'
  const pos = html.indexOf(marker)
  if (pos === -1) return null

  const arrayStart = pos + marker.length
  if (html[arrayStart] !== '[') return null

  let depth = 0, i = arrayStart
  for (; i < html.length; i++) {
    if (html[i] === '[' || html[i] === '{') depth++
    else if (html[i] === ']' || html[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }

  try {
    return JSON.parse(html.slice(arrayStart, i + 1)) as CaptionTrack[]
  } catch {
    return null
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return Response.json({ error: 'Invalid videoId' }, { status: 400 })
  }

  const cookie = request.headers.get('x-yt-cookie') ?? ''

  const pageHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
  if (cookie) pageHeaders['Cookie'] = cookie

  // ── 1. Fetch the video page ──────────────────────────────────────────────────
  let html: string
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: pageHeaders,
      signal: AbortSignal.timeout(15000),
    })
    if (!pageRes.ok) {
      return Response.json({ error: `YouTube page ${pageRes.status}` }, { status: pageRes.status })
    }
    html = await pageRes.text()
  } catch (e) {
    return Response.json({ error: `Page fetch failed: ${String(e)}` }, { status: 502 })
  }

  // ── 2. Extract caption track list ────────────────────────────────────────────
  const tracks = extractCaptionTracks(html)
  if (!tracks?.length) {
    return Response.json({ error: 'No caption tracks found in player response' }, { status: 422 })
  }

  // Prefer English human captions, fall back to ASR, then first track
  const enHuman = tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr')
  const enAsr   = tracks.find(t => t.languageCode === 'en')
  const enAny   = tracks.find(t => t.languageCode?.startsWith('en'))
  const best    = enHuman ?? enAsr ?? enAny ?? tracks[0]
  const isASR   = best.kind === 'asr' || (!enHuman && !!enAsr)

  // ── 3. Fetch caption data (json3 format) ─────────────────────────────────────
  // YouTube's timedtext endpoint stopped answering GET with a body reliably
  // (PoToken anti-bot gating) — POST without a body is what works today.
  // Keep GET as a fallback in case that changes again.
  let segments: SegmentOut[]
  try {
    const captionUrl = `${best.baseUrl}&fmt=json3`
    let captText = ''
    for (const method of ['POST', 'GET'] as const) {
      const res = await fetch(captionUrl, { method, headers: pageHeaders, signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const text = await res.text()
      if (text) { captText = text; break }
    }
    if (!captText) {
      return Response.json({ error: 'Caption data empty (PoToken block?)' }, { status: 502 })
    }

    const captData = JSON.parse(captText) as {
      events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8: string }> }>
    }

    segments = (captData.events ?? [])
      .filter(e => e.segs?.length && e.tStartMs !== undefined)
      .map(e => ({
        text: e.segs!.map(s => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim(),
        start: (e.tStartMs ?? 0) / 1000,
        duration: Math.max(0.1, (e.dDurationMs ?? 2000) / 1000),
      }))
      .filter(s => s.text)
  } catch (e) {
    return Response.json({ error: `Caption data failed: ${String(e)}` }, { status: 502 })
  }

  if (!segments.length) {
    return Response.json({ error: 'Empty caption segments' }, { status: 422 })
  }

  const hasMusicalSymbol = segments.some(s => s.text.includes('♪') || s.text.includes('🎵'))

  return Response.json({ segments, isASR, hasMusicalSymbol })
}
