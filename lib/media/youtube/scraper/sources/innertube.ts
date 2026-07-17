import { buildCookieString } from '../cookies'
import type { TranscriptSegment } from '../../types'

// Fetch captions via youtubei.js (full InnerTube client, uses session cookies)
export async function fetchCaptionsViaYoutubei(videoId: string): Promise<TranscriptSegment[]> {
  const { Innertube } = await import('youtubei.js')
  const cookieString = buildCookieString()

  const yt = await Innertube.create({
    cookie: cookieString,
    retrieve_player: false,
  })

  const info = await yt.getInfo(videoId)
  const transcriptData = await info.getTranscript()

  const rawSegments = transcriptData?.transcript?.content?.body?.initial_segments
  if (!rawSegments?.length) throw new Error('No transcript segments found via InnerTube.')

  type RawSeg = { snippet?: { text?: string }; start_ms?: string | number; end_ms?: string | number }
  return (rawSegments as unknown as RawSeg[])
    .filter((s) => s.snippet?.text)
    .map((s) => ({
      text: s.snippet!.text!.replace(/\n/g, ' ').trim(),
      start: Number(s.start_ms) / 1000,
      duration: Math.max(0.1, (Number(s.end_ms) - Number(s.start_ms)) / 1000),
    }))
}
