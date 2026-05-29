import { NextResponse } from 'next/server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import { normalizeFlashcard } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { word: string }
    const word = body.word?.trim()
    if (!word) return NextResponse.json({ error: 'Word cannot be empty.' }, { status: 400 })

    const prompt = `Generate a flashcard for the English word: "${word}"

Return ONLY valid JSON:
{
  "word": "${word}",
  "translation": "Portuguese translation",
  "explanation": "simple English explanation",
  "example": "natural English example sentence"
}`

    const response = await callLLM(prompt)
    const parsed = safeJsonParse<Record<string, unknown>>(response)

    if ('error' in parsed) return NextResponse.json(parsed, { status: 500 })

    const card = normalizeFlashcard(parsed)
    if (!card) return NextResponse.json({ error: 'AI returned an empty flashcard.' }, { status: 500 })

    return NextResponse.json(card)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
