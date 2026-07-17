import { fetchCaptions } from '../scraper/captions'
import { getVideoTitle } from '../scraper/metadata'
import { extractVideoId } from '../url'
import { errorMessage, InvalidYouTubeUrlError } from '../errors'
import { transcriptCache } from '../cache'
import { mergeIntoSentences, sanitizeSegments, splitAtSentenceBoundaries } from '../parser/segments'
import { reviewAndCleanSegments } from './enhancement'
import { transcribeAudioFallback } from './audio-fallback'
import type { FastTranscriptResult, TranscriptSegment, VideoData } from '../types'

export async function updateTranscriptCache(videoId: string, segments: TranscriptSegment[]): Promise<void> {
  await transcriptCache.set(videoId, segments)
}

function cachedToVideoData(videoId: string, title: string, cached: { transcript: string; segments: TranscriptSegment[] }): VideoData {
  return {
    video_id: videoId,
    title,
    transcript: cached.transcript,
    segments: cached.segments,
    source: 'youtube_captions',
  }
}

function processingError(captionError: unknown, audioError: unknown): Error {
  return new Error(
    [
      'Could not process this YouTube video.',
      `Caption extraction failed: ${errorMessage(captionError)}`,
      `Audio transcription fallback failed: ${errorMessage(audioError)}`,
    ].join(' '),
  )
}

// Fast path: returns transcript immediately without GPT repair.
// Use with after() in the route to repair captions in background.
export async function getTranscriptFast(url: string): Promise<FastTranscriptResult> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new InvalidYouTubeUrlError()

  const [title, cached] = await Promise.all([
    getVideoTitle(videoId),
    transcriptCache.get(videoId),
  ])

  if (cached) {
    return {
      data: cachedToVideoData(videoId, title, cached),
      videoId,
      mergedSegments: [],
      needsRepair: false,
    }
  }

  let raw: TranscriptSegment[]
  try {
    raw = await fetchCaptions(videoId)
  } catch (captionError) {
    try {
      const fallback = await transcribeAudioFallback(videoId)
      return {
        data: { video_id: videoId, title, transcript: fallback.transcript, segments: fallback.segments, source: 'whisper' },
        videoId,
        mergedSegments: [],
        needsRepair: false,
      }
    } catch (audioError) {
      throw processingError(captionError, audioError)
    }
  }

  const sanitized = sanitizeSegments(raw)
  const merged = mergeIntoSentences(sanitized)
  const segments = splitAtSentenceBoundaries(merged)
  const transcript = segments.map((s) => s.text).join('\n')

  const withEnd = merged.filter((s) => /[.!?]$/.test(s.text.trim())).length
  const needsRepair = merged.length > 0 && withEnd / merged.length <= 0.35

  void updateTranscriptCache(videoId, segments).catch((e: unknown) =>
    console.error('[transcript-cache] fast write failed:', e),
  )

  return {
    data: { video_id: videoId, title, transcript, segments, source: 'youtube_captions' },
    videoId,
    mergedSegments: merged,
    needsRepair,
  }
}

// Full path: fetch, sanitize, AI-clean and cache before returning.
export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new InvalidYouTubeUrlError()

  const [title, cached] = await Promise.all([
    getVideoTitle(videoId),
    // Check the cache first — avoids hitting YouTube when quota is exhausted
    transcriptCache.get(videoId),
  ])

  if (cached) return cachedToVideoData(videoId, title, cached)

  try {
    const raw       = await fetchCaptions(videoId)
    const sanitized = sanitizeSegments(raw)
    const merged    = mergeIntoSentences(sanitized)
    const cleaned   = await reviewAndCleanSegments(merged)
    const segments  = splitAtSentenceBoundaries(cleaned)
    const transcript = segments.map((s) => s.text).join('\n')

    // Persist to cache asynchronously — don't block the response
    void updateTranscriptCache(videoId, segments).catch((e: unknown) =>
      console.error('[transcript-cache] write failed:', e),
    )

    return { video_id: videoId, title, transcript, segments, source: 'youtube_captions' }
  } catch (captionError) {
    try {
      const fallback = await transcribeAudioFallback(videoId)
      return {
        video_id: videoId,
        title,
        transcript: fallback.transcript,
        segments: fallback.segments,
        source: 'whisper',
      }
    } catch (audioError) {
      throw processingError(captionError, audioError)
    }
  }
}
