import { parseSrt } from '../../parser/srt'
import type { TranscriptSegment } from '../../types'

// Fetch captions via YouTube Data API v3
export async function fetchCaptionsViaDataAPI(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set.')

  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`,
  )
  if (!listRes.ok) {
    const err = await listRes.json() as { error?: { message?: string } }
    throw new Error(`Caption list failed: ${err?.error?.message ?? listRes.status}`)
  }
  const listData = await listRes.json() as {
    items: Array<{ id: string; snippet: { language: string; trackKind: string; name: string } }>
  }

  if (!listData.items?.length) {
    throw new Error('No caption tracks found for this video.')
  }

  const tracks = listData.items
  const enTrack =
    tracks.find(t => t.snippet.language === 'en' && t.snippet.trackKind !== 'asr') ||
    tracks.find(t => t.snippet.language === 'en') ||
    tracks.find(t => t.snippet.language.startsWith('en')) ||
    tracks[0]

  const dlRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${enTrack.id}?tfmt=srt&key=${apiKey}`,
  )

  if (!dlRes.ok) {
    throw new Error(`Caption download requires OAuth (track is not publicly downloadable).`)
  }

  const srtText = await dlRes.text()
  return parseSrt(srtText)
}
