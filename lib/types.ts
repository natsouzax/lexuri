import { createHash } from 'crypto'

export interface Flashcard {
  id: string
  word: string
  translation: string
  explanation: string
  example: string
  timestamp: number | null
  source_video: string | null
  created_at: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  last_reviewed: string | null
}

export interface TranscriptSegment {
  text: string
  start: number
  duration: number
  synthetic?: boolean
}

export interface VideoData {
  video_id: string
  title: string
  transcript: string
  segments: TranscriptSegment[]
  source: 'youtube_captions' | 'whisper'
}

export interface VocabItem {
  word: string
  context: string
  reason: string
}

export interface QuizData {
  question: string
  options: string[]
  answer: string
}

export interface SongData {
  title: string
  artist: string
  lyrics: string
  genius_url?: string
}

export function normalizeWord(word: string): string {
  return word.replace(/[^A-Za-z']/g, '').toLowerCase().replace(/^'+|'+$/g, '')
}

export function buildFlashcardId(
  word: string,
  sourceVideo?: string | null,
  timestamp?: number | null,
): string {
  const normalizedWord = word.trim().toLowerCase()
  const sourceStr = sourceVideo ?? ''
  const tsStr = timestamp != null ? String(Math.round(timestamp * 1000) / 1000) : ''
  const raw = `${normalizedWord}|${sourceStr}|${tsStr}`
  return createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

export function normalizeFlashcard(
  data: Record<string, unknown>,
  sourceVideo?: string | null,
  timestamp?: number | null,
): Flashcard | null {
  const word = String(data.word ?? '').trim().toLowerCase()
  if (!word) return null

  const explanation =
    String(data.explanation ?? data.definition ?? data.meaning ?? '').trim()
  const example =
    String(data.example ?? data.example_sentence ?? data.sentence ?? '').trim()

  const ts = timestamp ?? (typeof data.timestamp === 'number' ? data.timestamp : null)
  const sv = sourceVideo ?? (typeof data.source_video === 'string' ? data.source_video : null)

  return {
    id: buildFlashcardId(word, sv, ts),
    word,
    translation: String(data.translation ?? '').trim(),
    explanation,
    example,
    timestamp: ts,
    source_video: sv,
    created_at: typeof data.created_at === 'string' ? data.created_at : new Date().toISOString(),
    ease_factor: typeof data.ease_factor === 'number' ? data.ease_factor : 2.5,
    interval: typeof data.interval === 'number' ? data.interval : 1,
    repetitions: typeof data.repetitions === 'number' ? data.repetitions : 0,
    next_review:
      typeof data.next_review === 'string' ? data.next_review : new Date().toISOString(),
    last_reviewed:
      typeof data.last_reviewed === 'string' ? data.last_reviewed : null,
  }
}
