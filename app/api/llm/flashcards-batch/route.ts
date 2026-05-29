import { NextResponse } from 'next/server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import { normalizeFlashcard } from '@/lib/types'
import type { Flashcard } from '@/lib/types'

interface BatchRequest {
  words: string[]
  source_video?: string
  timestamps?: Record<string, number | null>
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BatchRequest
    const seen = new Set<string>()
    const cleanWords: string[] = []

    for (const w of body.words ?? []) {
      const normalized = w.trim().toLowerCase()
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized)
        cleanWords.push(normalized)
      }
    }

    if (!cleanWords.length) return NextResponse.json([])

    const prompt = `Create English learning flashcards for these selected words:
${JSON.stringify(cleanWords)}

Return ONLY valid JSON array. Each item must have:
[
  {
    "word": "...",
    "translation": "Portuguese translation",
    "explanation": "simple English explanation",
    "example": "natural English example sentence"
  }
]`

    const response = await callLLM(prompt)
    const parsed = safeJsonParse<unknown[]>(response)

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        [{ error: (parsed as Record<string, string>).error ?? 'Invalid response from AI' }],
        { status: 500 },
      )
    }

    const cards: Flashcard[] = []
    const timestampMap = body.timestamps ?? {}

    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue
      const record = item as Record<string, unknown>
      const word = String(record.word ?? '').trim().toLowerCase()
      const card = normalizeFlashcard(record, body.source_video, timestampMap[word] ?? null)
      if (card) cards.push(card)
    }

    const processedWords = new Set(cards.map((c) => c.word))
    for (const missing of cleanWords) {
      if (!processedWords.has(missing)) {
        const fallback = normalizeFlashcard(
          {
            word: missing,
            translation: 'Translation not available',
            explanation: `A selected English word from the transcript: ${missing}.`,
            example: `I heard the word ${missing} in the video.`,
          },
          body.source_video,
          timestampMap[missing] ?? null,
        )
        if (fallback) cards.push(fallback)
      }
    }

    return NextResponse.json(cards)
  } catch (e) {
    return NextResponse.json([{ error: String(e) }], { status: 500 })
  }
}
