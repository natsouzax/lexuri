import fs from 'fs'
import os from 'os'
import path from 'path'
import { YoutubeTranscript } from 'youtube-transcript'
import { getOpenAIClient } from './openai'
import type { TranscriptSegment, VideoData } from './types'

// Convert YOUTUBE_COOKIES JSON array → "name=value; name2=value2" string for youtubei.js
function buildCookieString(): string | undefined {
  const raw = process.env.YOUTUBE_COOKIES
  if (!raw) return undefined
  try {
    const cookies = JSON.parse(raw) as Array<{ name: string; value: string }>
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  } catch {
    return undefined
  }
}

const MAX_AUDIO_BYTES = 24 * 1024 * 1024
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL ?? 'gpt-4o-mini-transcribe'
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY

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

function parseSrt(srt: string): TranscriptSegment[] {
  const blocks = srt.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue

    const tsLine = lines.find(l => l.includes('-->'))
    if (!tsLine) continue

    const [startStr, endStr] = tsLine.split('-->')
    const start = parseTimestamp(startStr)
    const end = parseTimestamp(endStr)
    const duration = Math.max(0.1, end - start)

    const tsIdx = lines.indexOf(tsLine)
    const text = lines.slice(tsIdx + 1).map(stripXmlTags).join(' ').trim()
    if (!text) continue

    segments.push({ text, start, duration })
  }

  return segments
}

// Fetch transcript via Supadata.ai — bypasses YouTube IP blocks on Vercel/datacenter IPs
async function fetchCaptionsViaSupadata(videoId: string): Promise<TranscriptSegment[]> {
  if (!SUPADATA_API_KEY) throw new Error('SUPADATA_API_KEY is not set.')

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=false&lang=en`,
    {
      headers: { 'x-api-key': SUPADATA_API_KEY },
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

// Fetch captions via YouTube Data API v3
async function fetchCaptionsViaDataAPI(videoId: string): Promise<TranscriptSegment[]> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not set.')

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

  const tracks = listData.items
  const enTrack =
    tracks.find(t => t.snippet.language === 'en' && t.snippet.trackKind !== 'asr') ||
    tracks.find(t => t.snippet.language === 'en') ||
    tracks.find(t => t.snippet.language.startsWith('en')) ||
    tracks[0]

  const dlRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${enTrack.id}?tfmt=srt&key=${YOUTUBE_API_KEY}`,
  )

  if (!dlRes.ok) {
    throw new Error(`Caption download requires OAuth (track is not publicly downloadable).`)
  }

  const srtText = await dlRes.text()
  return parseSrt(srtText)
}

// Fetch captions via youtubei.js (full InnerTube client, uses session cookies)
async function fetchCaptionsViaYoutubei(videoId: string): Promise<TranscriptSegment[]> {
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

// Fetch captions via youtube-transcript package (InnerTube API)
// NOTE: This is blocked by YouTube on Vercel/datacenter IPs — kept as last resort
async function fetchCaptionsPublic(videoId: string): Promise<TranscriptSegment[]> {
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

async function fetchCaptions(videoId: string): Promise<TranscriptSegment[]> {
  const errors: string[] = []

  // Attempt 1: Supadata.ai — works on Vercel/datacenter IPs, bypasses YouTube blocks
  if (SUPADATA_API_KEY) {
    try {
      const segments = await fetchCaptionsViaSupadata(videoId)
      if (segments.length > 0) return segments
      errors.push('supadata: empty result')
    } catch (e) {
      errors.push(`supadata: ${errorMessage(e)}`)
    }
  } else {
    errors.push('supadata: SUPADATA_API_KEY not set')
  }

  // Attempt 2: YouTube Data API v3 (requires YOUTUBE_API_KEY)
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

  // Attempt 3: youtubei.js — full InnerTube client with session cookies
  try {
    const segments = await fetchCaptionsViaYoutubei(videoId)
    if (segments.length > 0) return segments
    errors.push('youtubei: empty result')
  } catch (e) {
    errors.push(`youtubei: ${errorMessage(e)}`)
  }

  // Attempt 4: youtube-transcript package (blocked on Vercel IPs, kept as last resort)
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
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY required for audio fallback.')

  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`,
  )
  const videoData = await videoRes.json() as {
    items?: Array<{ contentDetails: { duration: string } }>
  }
  const duration = parseIsoDuration(videoData.items?.[0]?.contentDetails?.duration ?? 'PT0S')
  if (duration > 1800) throw new Error('Video is too long for audio transcription (max 30 min).')

  throw new Error(
    'Audio transcription fallback is not available in this environment. ' +
    'Please use a video with captions enabled, or paste the transcript manually.',
  )
}

// Merge raw caption segments into display-ready subtitle blocks.
//
// Two modes, detected automatically:
//
//  WELL-FORMATTED (human captions, e.g. TED talks): >35% of segments already end
//  with sentence-ending punctuation. Trust the original structure — pass each segment
//  through as its own block. Only merge tiny stray fragments (<3 words, tiny gap).
//
//  ASR (auto-generated, no punctuation): use time-based heuristics —
//  pause >300ms, word-count cap, or max 5s duration.
function mergeIntoSentences(raw: TranscriptSegment[]): TranscriptSegment[] {
  if (!raw.length) return raw

  const withSentenceEnd = raw.filter((s) => /[.!?]/.test(s.text)).length
  const wellFormatted   = withSentenceEnd / raw.length > 0.35

  const result: TranscriptSegment[] = []
  let buf: TranscriptSegment[] = []

  function flush() {
    if (!buf.length) return
    const text  = buf.map((s) => s.text.trim()).filter(Boolean).join(' ')
    const start = buf[0].start
    const last  = buf[buf.length - 1]
    result.push({
      text,
      start,
      duration: Math.max(0.1, last.start + last.duration - start),
      synthetic: buf.some((s) => s.synthetic),
    })
    buf = []
  }

  for (let i = 0; i < raw.length; i++) {
    buf.push(raw[i])

    const tail        = raw[i].text.trim()
    const next        = raw[i + 1]
    const gap         = next ? next.start - (raw[i].start + raw[i].duration) : 999
    const accumulated = buf.reduce((s, seg) => s + seg.duration, 0)
    const wordCount   = buf.reduce((n, seg) => n + (seg.text.match(/\S+/g)?.length ?? 0), 0)

    if (wellFormatted) {
      // Trust original caption breaks: flush as soon as we have a "real" segment (≥3 words).
      // Only hold tiny fragments (<3 words, <80ms gap) to merge with what follows.
      const isStrayFragment = wordCount < 3 && gap < 0.08
      const sentenceEnd     = /[.!?]$/.test(tail)
      if (!isStrayFragment || sentenceEnd || accumulated >= 6.0) flush()
    } else {
      // ASR mode: no punctuation — rely on pauses, word count, and duration.
      const sentenceEnd  = /[.!?]$/.test(tail)
      const longPause    = gap > 0.30
      const wordCapReached = wordCount >= 12 && /[,;]$/.test(tail)
      const tooLong      = accumulated >= 5.0
      if (sentenceEnd || longPause || wordCapReached || tooLong) flush()
    }
  }

  flush()
  return result
}

// For ASR (auto-generated) captions: add missing punctuation and fix capitalisation.
// Sends segments in numbered batches to gpt-4o-mini; timing is preserved unchanged.
async function repairASRPunctuation(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
  if (!segments.length) return segments

  // Only run on ASR transcripts (≤35 % of segments already end with sentence punctuation)
  const withEnd = segments.filter((s) => /[.!?]$/.test(s.text.trim())).length
  if (withEnd / segments.length > 0.35) return segments

  const BATCH = 60
  const result: TranscriptSegment[] = []

  for (let i = 0; i < segments.length; i += BATCH) {
    const batch = segments.slice(i, i + BATCH)
    const numbered = batch.map((s, idx) => `${idx + 1}. ${s.text}`).join('\n')

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a transcript editor. Add proper punctuation and capitalisation to each line.\n' +
              'Rules:\n' +
              '- Return EXACTLY the same number of lines, each starting with "N. " (same number as input)\n' +
              '- Only add or fix punctuation and capitalisation — do NOT change, add, or remove words\n' +
              '- Each line should end with appropriate punctuation (. ! ?)\n' +
              '- Keep contractions, slang, and informal speech exactly as written',
          },
          { role: 'user', content: numbered },
        ],
        temperature: 0,
      })

      const lines = (response.choices[0].message.content ?? '').split('\n').filter(Boolean)
      batch.forEach((seg, idx) => {
        const raw = lines[idx]?.replace(/^\d+\.\s*/, '').trim()
        result.push({ ...seg, text: raw ?? seg.text })
      })
    } catch {
      // On failure keep original batch unchanged
      result.push(...batch)
    }
  }

  return result
}

export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const title = await getVideoTitle(videoId)

  try {
    const raw      = await fetchCaptions(videoId)
    const merged   = mergeIntoSentences(raw)
    const segments = await repairASRPunctuation(merged)
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
