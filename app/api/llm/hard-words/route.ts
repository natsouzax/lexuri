import { NextResponse } from 'next/server'
import { callLLM, safeJsonParse } from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text: string; level?: string }
    const level = body.level ?? 'intermediate'

    const prompt = `Extract difficult English words from this text for a ${level} learner.

Return ONLY valid JSON array:
["word1", "word2", "word3"]

Text:
${body.text}`

    const response = await callLLM(prompt)
    const parsed = safeJsonParse<string[]>(response)

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Error parsing words from AI.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
