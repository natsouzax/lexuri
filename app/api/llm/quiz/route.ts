import { NextResponse } from 'next/server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import type { QuizData } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { word: string; explanation: string }
    const { word, explanation } = body

    const prompt = `Create a multiple choice quiz for the word "${word}" with definition "${explanation}".

Return ONLY valid JSON:
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "correct option"
}

Rules:
- 1 correct answer
- 3 plausible wrong answers
- Shuffle options`

    const response = await callLLM(prompt)
    const parsed = safeJsonParse<QuizData>(response)

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.options)) {
      return NextResponse.json({ error: 'AI returned an invalid quiz structure.' }, { status: 500 })
    }

    if (!parsed.options.includes(parsed.answer)) {
      return NextResponse.json({ error: 'AI returned an invalid quiz structure.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
