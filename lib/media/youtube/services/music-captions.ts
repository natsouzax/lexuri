import { fetchEdgePageCaptions } from '../scraper/sources/edge-page'
import { sanitizeSegments } from '../parser/segments'
import type { TranscriptSegment } from '../types'

// Strict music captions: only accept human-verified or ♪-marked tracks.
// Returns null if the captions don't meet the bar — the caller should fall
// back to dedicated lyrics sources.
export async function getMusicCaptions(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const data = await fetchEdgePageCaptions(videoId)
    if (!data.segments?.length) return null

    // Accept ONLY human-captioned tracks or tracks with musical symbols
    const isHighQuality = !data.isASR || data.hasMusicalSymbol
    if (!isHighQuality) return null

    return sanitizeSegments(data.segments)
  } catch {
    return null
  }
}
