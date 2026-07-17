import type { TranscriptSegment } from '../../types'

// Fetch transcript via Supadata.ai — bypasses YouTube IP blocks on Vercel/datacenter IPs
export async function fetchCaptionsViaSupadata(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY is not set.')

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=false&lang=en`,
    {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(15000),
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supadata error ${res.status}: ${body.slice(0, 120)}`)
  }

  const data = await res.json() as {
    content?: Array<{ text: string; offset: number; duration: number }>
    lang?: string
  }

  if (!data.content?.length) throw new Error('Supadata returned empty transcript.')

  // Reject non-English captions so the next source is tried
  if (data.lang && !data.lang.startsWith('en')) {
    throw new Error(`Supadata returned non-English captions (lang: ${data.lang}).`)
  }

  // Supadata returns offset in milliseconds
  return data.content.map(item => ({
    text: item.text,
    start: item.offset / 1000,
    duration: Math.max(0.1, item.duration / 1000),
  }))
}
