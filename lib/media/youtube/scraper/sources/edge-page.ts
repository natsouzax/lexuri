import { buildCookieString } from '../cookies'
import type { EdgePageCaptions, TranscriptSegment } from '../../types'

// Fetch captions via the Edge function (app/api/youtube/fetch-page — runs on
// Cloudflare IPs, bypassing YouTube's datacenter IP block that affects
// Vercel Lambda / AWS). Returns caption-track metadata alongside segments.
export async function fetchEdgePageCaptions(videoId: string): Promise<EdgePageCaptions> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const cookie = buildCookieString() ?? ''

  const res = await fetch(`${appUrl}/api/youtube/fetch-page?videoId=${videoId}`, {
    headers: { 'x-yt-cookie': cookie },
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string }
    throw new Error(`Edge fetch: ${body.error ?? res.status}`)
  }

  const data = await res.json() as EdgePageCaptions & { error?: string }

  if (data.error || !data.segments?.length) throw new Error(data.error ?? 'No segments returned by Edge function')
  return data
}

export async function fetchCaptionsViaPage(videoId: string): Promise<TranscriptSegment[]> {
  const { segments } = await fetchEdgePageCaptions(videoId)
  return segments
}
