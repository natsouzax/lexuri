import { YoutubeTranscript } from 'youtube-transcript'
import { getOpenAIClient } from './openai'
import { getAdminClient } from './supabase'
import type { TranscriptSegment, VideoData } from './types'

// Convert YOUTUBE_COOKIES JSON array → "name=value; name2=value2" string for youtubei.js
function buildCookieString(): string | undefined {
  let raw = process.env.YOUTUBE_COOKIES?.trim()
  if (!raw) return undefined

  if (raw.startsWith('YOUTUBE_COOKIES=')) raw = raw.slice('YOUTUBE_COOKIES='.length).trim()
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim()
  }

  if (!raw.startsWith('[')) return raw

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
const YOUTUBE_TRANSCRIPT_PROXY_URL = process.env.YOUTUBE_TRANSCRIPT_PROXY_URL

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

async function fetchCaptionsViaProxy(videoId: string): Promise<TranscriptSegment[]> {
  if (!YOUTUBE_TRANSCRIPT_PROXY_URL) throw new Error('YOUTUBE_TRANSCRIPT_PROXY_URL is not set.')

  const proxyUrl = new URL(YOUTUBE_TRANSCRIPT_PROXY_URL)
  proxyUrl.searchParams.set('videoId', videoId)

  const cookie = buildCookieString() ?? ''
  const headers: Record<string, string> = {}
  if (cookie) headers['x-yt-cookie'] = cookie

  const res = await fetch(proxyUrl, {
    headers,
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string }
    throw new Error(`Transcript proxy: ${body.error ?? res.status}`)
  }

  const data = await res.json() as {
    segments: TranscriptSegment[]
    error?: string
  }

  if (data.error || !data.segments?.length) throw new Error(data.error ?? 'No segments returned by transcript proxy')
  return data.segments
}

// Fetch captions via the Edge function (runs on Cloudflare IPs, bypassing
// YouTube's datacenter IP block that affects Vercel Lambda / AWS).
async function fetchCaptionsViaPage(videoId: string): Promise<TranscriptSegment[]> {
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

  const data = await res.json() as {
    segments: TranscriptSegment[]
    isASR: boolean
    hasMusicalSymbol: boolean
    error?: string
  }

  if (data.error || !data.segments?.length) throw new Error(data.error ?? 'No segments returned by Edge function')
  return data.segments
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

  if (YOUTUBE_TRANSCRIPT_PROXY_URL) {
    try {
      const segments = await fetchCaptionsViaProxy(videoId)
      if (segments.length > 0) return segments
      errors.push('proxy: empty result')
    } catch (e) {
      errors.push(`proxy: ${errorMessage(e)}`)
    }
  } else {
    errors.push('proxy: YOUTUBE_TRANSCRIPT_PROXY_URL not set')
  }

  // Attempt 3: Direct page fetch with browser headers + session cookies (json3 format)
  try {
    const segments = await fetchCaptionsViaPage(videoId)
    if (segments.length > 0) return segments
    errors.push('page-fetch: empty result')
  } catch (e) {
    errors.push(`page-fetch: ${errorMessage(e)}`)
  }

  // Attempt 4: youtubei.js — full InnerTube client with session cookies
  try {
    const segments = await fetchCaptionsViaYoutubei(videoId)
    if (segments.length > 0) return segments
    errors.push('youtubei: empty result')
  } catch (e) {
    errors.push(`youtubei: ${errorMessage(e)}`)
  }

  // Attempt 5: youtube-transcript package (blocked on Vercel IPs, kept as last resort)
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

const ARTIFACT_RE = /^\s*(\[(Music|Applause|Laughter|Cheering|Noise|Inaudible)\]|(uh+|um+|ah+|mm+|hmm+)\.?)\s*$/i

// Sanitize raw caption segments before any merging or AI processing:
// 1. Sort by start time — multi-track fetchers (youtubei.js, Supadata) may interleave two tracks.
// 2. Strip standalone artifacts ([Music], gasps) before they can influence the merge.
// 3. Resolve overlapping segments (>0.5s overlap = two tracks at same window) by keeping
//    whichever segment has more words — more text = more informative caption.
function sanitizeSegments(raw: TranscriptSegment[]): TranscriptSegment[] {
  if (!raw.length) return raw

  const sorted = [...raw].sort((a, b) => a.start - b.start)
  const result: TranscriptSegment[] = []

  for (const seg of sorted) {
    if (ARTIFACT_RE.test(seg.text)) continue

    const prev = result[result.length - 1]
    if (!prev) { result.push(seg); continue }

    const overlap = (prev.start + prev.duration) - seg.start

    if (overlap <= 0.5) {
      result.push(seg)
      continue
    }

    // Significant overlap: keep whichever has more words
    const prevWords = prev.text.trim().split(/\s+/).length
    const currWords = seg.text.trim().split(/\s+/).length
    if (currWords > prevWords) result[result.length - 1] = seg
  }

  return result
}

// Merge raw caption segments into display-ready subtitle blocks.
//
// Two modes, detected automatically:
//
//  WELL-FORMATTED (human captions, e.g. TED talks): >35% of segments already end
//  with sentence-ending punctuation. Trust the original structure — pass each segment
//  through as its own block. Only merge tiny stray fragments (<3 words, <80ms gap).
//
//  ASR (auto-generated, no punctuation): accumulate until a genuine sentence boundary
//  is found. Do NOT cut on short pauses — repairASRPunctuation + splitAtSentenceBoundaries
//  handle the real splitting after punctuation is added by GPT. Cutting mid-sentence here
//  causes GPT to add wrong punctuation at the fragment boundary.
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
      // ASR mode: only cut on real sentence boundaries — NOT on short pauses.
      // Short pauses (≤2s) are normal within a sentence and must not trigger a cut.
      const sentenceEnd    = /[.!?]$/.test(tail)
      const naturalBreak   = wordCount >= 12 && /[,;]$/.test(tail) // clear clause end
      const genuineSilence = gap > 2.0        // 2s+ silence = definite new sentence
      const hardLimit      = accumulated >= 20.0  // emergency cap, never infinite
      if (sentenceEnd || naturalBreak || genuineSilence || hardLimit) flush()
    }
  }

  flush()
  return result
}

// After merge + punctuation repair: split any segment that still contains multiple
// sentences into one segment per sentence. Also splits [Music] / [Verse] / [Chorus]
// style markers off into their own segments (isNonSpeech filters them from display).
export function splitAtSentenceBoundaries(segs: TranscriptSegment[]): TranscriptSegment[] {
  const result: TranscriptSegment[] = []
  for (const seg of segs) {
    // Split after ./?/! followed by space+capital, OR before any [Word] marker
    const parts = seg.text
      .split(/(?<=[.!?])\s+(?=[A-Z"(\[])|(?<=\])\s+/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (parts.length <= 1) { result.push(seg); continue }

    const totalLen = parts.reduce((s, p) => s + p.length, 0)
    let cursor = seg.start
    for (const part of parts) {
      const dur = Math.max(0.4, (part.length / totalLen) * seg.duration)
      result.push({ text: part, start: cursor, duration: dur, synthetic: seg.synthetic })
      cursor += dur
    }
  }
  return result
}

// For ASR (auto-generated) captions: add missing punctuation and fix capitalisation.
// Sends segments in numbered batches to gpt-4o-mini; timing is preserved unchanged.
export async function repairASRPunctuation(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
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

const SEGMENT_REVIEW_PROMPT =
  'You are a subtitle editor. The text below is auto-generated captions: no punctuation, awkward line breaks, possible artifacts.\n\n' +
  'Do these tasks in one pass:\n' +
  '1. Add proper punctuation (. ! ? , ;) and capitalise the first word of each sentence.\n' +
  '2. Re-break lines so each ends at a natural boundary — complete sentence, clause, or comma pause. Never break mid-phrase.\n' +
  '3. Merge fragments that were split mid-phrase (e.g. "It was a car" + "accident" → "It was a car accident.").\n' +
  '4. Remove non-speech artifacts: lines that contain ONLY sounds like [Music], [Applause], gasps (uh, um, ah, mm, hmm), or inaudible markers.\n\n' +
  'Output ONLY the final lines, one per line, no numbering, no explanation.\n' +
  'Do NOT change, add, or remove meaningful words — only fix formatting and remove artifacts.'

// Single-pass AI cleanup: adds punctuation, fixes broken line boundaries, removes gasps.
// Replaces repairASRPunctuation — one GPT call instead of two, better results.
// Timing is re-distributed proportionally by character length within each batch window.
export async function reviewAndCleanSegments(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
  if (!segments.length) return segments

  // Well-formatted (human captions): skip AI, only strip obvious artifacts
  const withEnd = segments.filter(s => /[.!?]$/.test(s.text.trim())).length
  if (withEnd / segments.length > 0.35) {
    return segments.filter(s => !/^\s*(\[.*?\]|(uh+|um+|ah+|mm+|hmm+)\.?)\s*$/i.test(s.text))
  }

  const BATCH = 80
  const result: TranscriptSegment[] = []

  for (let i = 0; i < segments.length; i += BATCH) {
    const batch = segments.slice(i, i + BATCH)
    const batchStart = batch[0].start
    const batchDuration = batch.reduce((s, seg) => s + seg.duration, 0)
    const inputText = batch.map(s => s.text.trim()).join('\n')

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SEGMENT_REVIEW_PROMPT },
          { role: 'user', content: inputText },
        ],
      })

      const lines = (response.choices[0].message.content ?? '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      if (!lines.length) { result.push(...batch); continue }

      // Re-distribute timing proportionally by character length within the batch window
      const totalChars = Math.max(1, lines.reduce((s, l) => s + l.length, 0))
      let cursor = batchStart
      for (const line of lines) {
        const duration = Math.max(0.4, (line.length / totalChars) * batchDuration)
        result.push({ text: line, start: cursor, duration })
        cursor += duration
      }
    } catch {
      result.push(...batch)
    }
  }

  return result
}

const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

export async function updateTranscriptCache(videoId: string, segments: TranscriptSegment[]): Promise<void> {
  const transcript = segments.map((s) => s.text).join('\n')
  await getAdminClient()
    .from('youtube_transcript_cache')
    .upsert({ video_id: videoId, transcript, segments, fetched_at: new Date().toISOString() })
}

// Fast path: returns transcript immediately without GPT repair.
// Use with after() in the route to repair captions in background.
export async function getTranscriptFast(url: string): Promise<{
  data: VideoData
  videoId: string
  mergedSegments: TranscriptSegment[]
  needsRepair: boolean
}> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const [title, cached] = await Promise.all([
    getVideoTitle(videoId),
    Promise.resolve(
      getAdminClient()
        .from('youtube_transcript_cache')
        .select('transcript, segments')
        .eq('video_id', videoId)
        .gt('fetched_at', new Date(Date.now() - CACHE_TTL_MS).toISOString())
        .maybeSingle(),
    ).then((r) => r.data).catch(() => null),
  ])

  if (cached) {
    return {
      data: {
        video_id: videoId,
        title,
        transcript: cached.transcript,
        segments: cached.segments as TranscriptSegment[],
        source: 'youtube_captions',
      },
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
      throw new Error(
        [
          'Could not process this YouTube video.',
          `Caption extraction failed: ${errorMessage(captionError)}`,
          `Audio transcription fallback failed: ${errorMessage(audioError)}`,
        ].join(' '),
      )
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

// Strict music captions: only accept human-verified or ♪-marked tracks.
// Returns null if the captions don't meet the bar — caller should fall back to
// lyrics sources (Spotify, lrclib, Letras, Genius, Cifra Club).
export async function getMusicCaptions(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    const cookie = buildCookieString() ?? ''

    const res = await fetch(`${appUrl}/api/youtube/fetch-page?videoId=${videoId}`, {
      headers: { 'x-yt-cookie': cookie },
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return null

    const data = await res.json() as {
      segments: TranscriptSegment[]
      isASR: boolean
      hasMusicalSymbol: boolean
    }

    if (!data.segments?.length) return null

    // Accept ONLY human-captioned tracks or tracks with musical symbols
    const isHighQuality = !data.isASR || data.hasMusicalSymbol
    if (!isHighQuality) return null

    return sanitizeSegments(data.segments)
  } catch {
    return null
  }
}

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
]

// Search YouTube for a video by artist + title.
// Primary: YouTube Data API v3 (requires YOUTUBE_API_KEY).
// Fallback: public Invidious instances (no key needed).
export async function searchYouTubeVideo(artist: string, title: string): Promise<string | null> {
  if (YOUTUBE_API_KEY) {
    try {
      const q = encodeURIComponent(`${artist} ${title} official video`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ id: { videoId: string } }> }
        const videoId = data.items?.[0]?.id?.videoId
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
      }
    } catch { /* fall through to Invidious */ }
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const q = encodeURIComponent(`${artist} ${title}`)
      const res = await fetch(
        `${instance}/api/v1/search?q=${q}&type=video&fields=videoId`,
        { signal: AbortSignal.timeout(5000) },
      )
      if (res.ok) {
        const data = (await res.json()) as Array<{ videoId?: string }>
        const videoId = Array.isArray(data) ? data[0]?.videoId : undefined
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
      }
    } catch { /* try next instance */ }
  }

  return null
}

export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const [title, cached] = await Promise.all([
    getVideoTitle(videoId),
    // Check Supabase cache — avoids hitting YouTube when quota is exhausted
    Promise.resolve(
      getAdminClient()
        .from('youtube_transcript_cache')
        .select('transcript, segments')
        .eq('video_id', videoId)
        .gt('fetched_at', new Date(Date.now() - CACHE_TTL_MS).toISOString())
        .maybeSingle(),
    ).then(r => r.data).catch(() => null),
  ])

  if (cached) {
    return {
      video_id: videoId,
      title,
      transcript: cached.transcript,
      segments: cached.segments as TranscriptSegment[],
      source: 'youtube_captions',
    }
  }

  try {
    const raw       = await fetchCaptions(videoId)
    const sanitized = sanitizeSegments(raw)
    const merged    = mergeIntoSentences(sanitized)
    const cleaned   = await reviewAndCleanSegments(merged)
    const segments = splitAtSentenceBoundaries(cleaned)
    const transcript = segments.map((s) => s.text).join('\n')

    // Persist to cache asynchronously — don't block the response
    void Promise.resolve(
      getAdminClient()
        .from('youtube_transcript_cache')
        .upsert({ video_id: videoId, transcript, segments, fetched_at: new Date().toISOString() }),
    ).catch((e: unknown) => console.error('[transcript-cache] write failed:', e))

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
