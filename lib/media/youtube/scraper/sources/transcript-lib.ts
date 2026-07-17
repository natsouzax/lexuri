import { YoutubeTranscript } from 'youtube-transcript'
import type { TranscriptSegment } from '../../types'

// Fetch captions via youtube-transcript package (InnerTube API)
// NOTE: This is blocked by YouTube on Vercel/datacenter IPs — kept as last resort
export async function fetchCaptionsPublic(videoId: string): Promise<TranscriptSegment[]> {
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(async () => {
    return YoutubeTranscript.fetchTranscript(videoId)
  })

  if (!items?.length) throw new Error('No transcript items returned.')

  const inMs = items.some(item => item.duration > 100)

  return items.map(item => ({
    text: item.text,
    start: inMs ? item.offset / 1000 : item.offset,
    duration: Math.max(0.1, inMs ? item.duration / 1000 : item.duration),
  }))
}
