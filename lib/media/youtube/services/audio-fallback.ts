import { getVideoDurationSeconds } from '../scraper/metadata'
import type { TranscriptSegment } from '../types'

// Placeholder for the audio-transcription fallback (download audio + Whisper).
// Not available in serverless environments — kept as an explicit error so the
// caller reports a clear message and a future worker can implement it.
export async function transcribeAudioFallback(videoId: string): Promise<{
  transcript: string
  segments: TranscriptSegment[]
}> {
  const duration = await getVideoDurationSeconds(videoId)
  if (duration > 1800) throw new Error('Video is too long for audio transcription (max 30 min).')

  throw new Error(
    'Audio transcription fallback is not available in this environment. ' +
    'Please use a video with captions enabled, or paste the transcript manually.',
  )
}
