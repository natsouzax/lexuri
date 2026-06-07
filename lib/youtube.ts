import fs from 'fs'
import os from 'os'
import path from 'path'
import { pipeline } from 'stream/promises'
import ytdl from '@distube/ytdl-core'
import { YoutubeTranscript } from 'youtube-transcript'
import { getOpenAIClient } from './openai'
import type { TranscriptSegment, VideoData } from './types'

const MAX_AUDIO_BYTES = 24 * 1024 * 1024
const TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL ?? 'gpt-4o-mini-transcribe'

type TranscriptItem = {
  text?: string
  offset?: number | string
  start?: number | string
  duration?: number | string
}

type TranscriptAttempt = {
  label: string
  run: () => Promise<TranscriptItem[]>
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

function summarizeErrors(errors: string[]): string {
  return errors.map((err, i) => `${i + 1}. ${err}`).join(' | ')
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

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTime(value: unknown): number {
  const parsed = toFiniteNumber(value)
  if (parsed === null) return 0
  return parsed > 1000 ? parsed / 1000 : parsed
}

function normalizeTranscriptItems(items: TranscriptItem[]): TranscriptSegment[] {
  return items
    .map((item) => ({
      text: String(item.text ?? '').replace(/\s+/g, ' ').trim(),
      start: normalizeTime(item.offset ?? item.start),
      duration: Math.max(0.1, normalizeTime(item.duration)),
    }))
    .filter((segment) => segment.text.length > 0)
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

async function fetchCaptions(videoId: string): Promise<TranscriptSegment[]> {
  const attempts: TranscriptAttempt[] = [
    {
      label: 'youtube-transcript:en',
      run: () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }),
    },
    {
      label: 'youtube-transcript:en-US',
      run: () => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en-US' }),
    },
    {
      label: 'youtube-transcript:default',
      run: () => YoutubeTranscript.fetchTranscript(videoId),
    },
  ]

  const errors: string[] = []
  for (const attempt of attempts) {
    try {
      const segments = normalizeTranscriptItems(await attempt.run())
      if (segments.length > 0) return segments
      errors.push(`${attempt.label}: empty transcript`)
    } catch (error) {
      errors.push(`${attempt.label}: ${errorMessage(error)}`)
    }
  }

  throw new Error(`YouTube captions failed. ${summarizeErrors(errors)}`)
}

function buildYtdlAgent() {
  const raw = process.env.YOUTUBE_COOKIES
  if (!raw) return undefined
  try {
    const cookies = JSON.parse(raw)
    if (!Array.isArray(cookies)) return undefined
    return ytdl.createAgent(cookies)
  } catch {
    return undefined
  }
}

async function downloadAudioForTranscription(videoUrl: string, videoId: string): Promise<string> {
  const agent = buildYtdlAgent()
  const info = await ytdl.getInfo(videoUrl, agent ? { agent } : undefined)
  const format = ytdl.chooseFormat(info.formats, {
    quality: 'lowestaudio',
    filter: 'audioonly',
  })

  const contentLength = toFiniteNumber(format.contentLength)
  if (contentLength && contentLength > MAX_AUDIO_BYTES) {
    throw new Error('Audio is too large to transcribe within the serverless limit.')
  }

  const ext = format.container || 'webm'
  const filePath = path.join(os.tmpdir(), `verbly-${videoId}-${Date.now()}.${ext}`)
  const stream = ytdl.downloadFromInfo(info, { format, highWaterMark: 1 << 25, ...(agent && { agent }) })

  let downloadedBytes = 0
  stream.on('data', (chunk: Buffer) => {
    downloadedBytes += chunk.length
    if (downloadedBytes > MAX_AUDIO_BYTES) {
      stream.destroy(new Error('Audio is too large to transcribe within the serverless limit.'))
    }
  })

  await pipeline(stream, fs.createWriteStream(filePath))
  return filePath
}

async function transcribeAudioFallback(url: string, videoId: string): Promise<{
  transcript: string
  segments: TranscriptSegment[]
}> {
  let audioPath: string | null = null

  try {
    audioPath = await downloadAudioForTranscription(url, videoId)
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: TRANSCRIPTION_MODEL,
    })

    const transcript = transcription.text.trim()
    if (!transcript) throw new Error('OpenAI returned an empty transcription.')

    return {
      transcript,
      segments: buildSyntheticSegments(transcript),
    }
  } finally {
    if (audioPath) {
      fs.promises.unlink(audioPath).catch(() => {})
    }
  }
}

export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`
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
      const fallback = await transcribeAudioFallback(normalizedUrl, videoId)
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
