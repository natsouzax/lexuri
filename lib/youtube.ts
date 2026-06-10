import fs from 'fs'
import os from 'os'
import path from 'path'
import { YoutubeTranscript } from 'youtube-transcript'
import { getOpenAIClient } from './openai'
import type { TranscriptSegment, VideoData } from './types'

const MAX_AUDIO_BYTES = 24 * 1024 * 1024
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL ?? 'gpt-4o-mini-transcribe'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

export function extractVideoId(input: string): string | null {
  const value = input.trim()
  const directId = value.match(/^[a-zA-Z0-9_-]{11}$/)
  if (directId) return value

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }

  return null
}

export async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: 'no-store' },
    )
    if (!res.ok) return 'Untitled'
    const data = (await res.json()) as { title?: string }
    return data.title ?? 'Untitled'
  } catch {
    return 'Untitled'
  }
}

function buildSyntheticSegments(transcript: string): TranscriptSegment[] {
  const sentences = transcript
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  let cursor = 0
  return sentences.map((sentence) => {
    const wordCount = sentence.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 1
    const duration = Math.max(3, Math.min(12, wordCount * 0.45))
    const segment = { text: sentence, start: cursor, duration, synthetic: true }
    cursor += duration
    return segment
  })
}

// Parse ISO 8601 duration (e.g. PT1H2M3S) to seconds
function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0')
}

// Parse SRT/TTML caption text to plain text
function stripXmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
}

// Parse WebVTT/SRT timestamp to seconds
function parseTimestamp(ts: string): number {
  const parts = ts.trim().replace(',', '.').split(':')
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return 0
}

// Fetch captions via YouTube Data API v3
async function fetchCaptionsViaDataAPI(videoId: string): Promise<TranscriptSegment[]> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not set.')

  // Step 1: list available caption tracks
  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`,
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

  // Pick best English track: prefer ASR (auto-generated) if no manual track
  const tracks = listData.items
  const enTrack =
    tracks.find(t => t.snippet.language === 'en' && t.snippet.trackKind !== 'asr') ||
    tracks.find(t => t.snippet.language === 'en') ||
    tracks.find(t => t.snippet.language.startsWith('en')) ||
    tracks[0]

  // Step 2: download the caption track (SBV/SRT format)
  const dlRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${enTrack.id}?tfmt=srt&key=${YOUTUBE_API_KEY}`,
  )

  if (!dlRes.ok) {
    // Downloading captions requires OAuth for non-public tracks — fallback gracefully
    throw new Error(`Caption download requires OAuth (track is not publicly downloadable).`)
  }

  const srtText = await dlRes.text()
  return parseSrt(srtText)
}

function parseSrt(srt: string): TranscriptSegment[] {
  const blocks = srt.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue

    // Find timestamp line (contains -->)
    const tsLine = lines.find(l => l.includes('-->'))
    if (!tsLine) continue

    const [startStr, endStr] = tsLine.split('-->')
    const start = parseTimestamp(startStr)
    const end = parseTimestamp(endStr)
    const duration = Math.max(0.1, end - start)

    // Text is everything after the timestamp line
    const tsIdx = lines.indexOf(tsLine)
    const text = lines.slice(tsIdx + 1).map(stripXmlTags).join(' ').trim()
    if (!text) continue

    segments.push({ text, start, duration })
  }

  return segments
}

// Fetch captions via the youtube-transcript package (InnerTube API + HTML scraping fallback)
async function fetchCaptionsPublic(videoId: string): Promise<TranscriptSegment[]> {
  const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(async () => {
    // If English specifically not available, try without language constraint
    return YoutubeTranscript.fetchTranscript(videoId)
  })

  if (!items?.length) throw new Error('No transcript items returned.')

  // The package returns durations/offsets in ms for srv3 format and seconds for classic format.
  // Heuristic: if any duration exceeds 100 it must be in milliseconds (no caption line is 100+ seconds).
  const inMs = items.some(item => item.duration > 100)

  return items.map(item => ({
    text: item.text,
    start: inMs ? item.offset / 1000 : item.offset,
    duration: Math.max(0.1, inMs ? item.duration / 1000 : item.duration),
  }))
}

async function fetchCaptions(videoId: string): Promise<TranscriptSegment[]> {
  const errors: string[] = []

  // Attempt 1: YouTube Data API v3 (most reliable, requires API key)
  if (YOUTUBE_API_KEY) {
    try {
      const segments = await fetchCaptionsViaDataAPI(videoId)
      if (segments.length > 0) return segments
      errors.push('data-api: empty result')
    } catch (e) {
      errors.push(`data-api: ${errorMessage(e)}`)
    }
  } else {
    errors.push('data-api: YOUTUBE_API_KEY not set')
  }

  // Attempt 2: youtube-transcript package (InnerTube API + HTML scraping, no key needed)
  try {
    const segments = await fetchCaptionsPublic(videoId)
    if (segments.length > 0) return segments
    errors.push('transcript-lib: empty result')
  } catch (e) {
    errors.push(`transcript-lib: ${errorMessage(e)}`)
  }

  throw new Error(`YouTube captions failed. ${errors.map((err, i) => `${i + 1}. ${err}`).join(' | ')}`)
}

async function transcribeAudioFallback(videoId: string): Promise<{
  transcript: string
  segments: TranscriptSegment[]
}> {
  // Download audio via signed YouTube URL from Data API
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY required for audio fallback.')

  // Get video duration to check size
  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`,
  )
  const videoData = await videoRes.json() as {
    items?: Array<{ contentDetails: { duration: string } }>
  }
  const duration = parseIsoDuration(videoData.items?.[0]?.contentDetails?.duration ?? 'PT0S')
  if (duration > 1800) throw new Error('Video is too long for audio transcription (max 30 min).')

  // Use yt-dlp via shell if available, otherwise throw
  throw new Error(
    'Audio transcription fallback is not available in this environment. ' +
    'Please use a video with captions enabled, or paste the transcript manually.',
  )
}

export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const title = await getVideoTitle(videoId)

  try {
    const segments = await fetchCaptions(videoId)
    return {
      video_id: videoId,
      title,
      transcript: segments.map((s) => s.text).join(' '),
      segments,
      source: 'youtube_captions',
    }
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
      throw new Error(
        [
          'Could not process this YouTube video.',
          `Caption extraction failed: ${errorMessage(captionError)}`,
          `Audio transcription fallback failed: ${errorMessage(audioError)}`,
        ].join(' '),
      )
    }
  }
}
