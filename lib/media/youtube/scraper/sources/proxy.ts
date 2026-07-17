import { buildCookieString } from '../cookies'
import type { TranscriptSegment } from '../../types'

// Fetch captions via the external transcript proxy (e.g. Cloudflare Worker in
// workers/youtube-transcript-proxy.js) — runs on an IP space YouTube doesn't block.
export async function fetchCaptionsViaProxy(videoId: string): Promise<TranscriptSegment[]> {
  const proxyBase = process.env.YOUTUBE_TRANSCRIPT_PROXY_URL
  if (!proxyBase) throw new Error('YOUTUBE_TRANSCRIPT_PROXY_URL is not set.')

  const proxyUrl = new URL(proxyBase)
  proxyUrl.searchParams.set('videoId', videoId)

  const cookie = buildCookieString() ?? ''
  const headers: Record<string, string> = {}
  if (cookie) headers['x-yt-cookie'] = cookie

  const res = await fetch(proxyUrl, {
    headers,
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string }
    throw new Error(`Transcript proxy: ${body.error ?? res.status}`)
  }

  const data = await res.json() as {
    segments: TranscriptSegment[]
    error?: string
  }

  if (data.error || !data.segments?.length) throw new Error(data.error ?? 'No segments returned by transcript proxy')
  return data.segments
}
