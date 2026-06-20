import { NextResponse } from 'next/server'
import { getOpenAIClient, safeJsonParse } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'
import type { VocabItem } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { transcript: string; level: string }
    const { transcript, level } = body

    const prompt = `You are an English teacher AI.

Analyze the transcript below and extract vocabulary suitable for a ${level} learner.

Rules:
- Return 8 to 15 words
- Focus on useful, real-world English
- Avoid proper nouns, names, brands
- Include context sentences from the transcript
- Explain briefly why each word is relevant

IMPORTANT:
- Return ONLY valid JSON
- Do NOT include markdown or \`\`\`json blocks

Transcript:
${transcript}

Return JSON:
[
  {
    "word": "...",
    "context": "...",
    "reason": "..."
  }
]`

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = response.choices[0].message.content?.trim() ?? ''
    const parsed = safeJsonParse<VocabItem[]>(content)

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid vocabulary response from AI.' }, { status: 500 })
    }

    const items = parsed
      .filter((item): item is VocabItem => typeof item === 'object' && !!item.word?.trim())
      .map((item) => ({
        word: String(item.word).trim(),
        context: String(item.context ?? '').trim(),
        reason: String(item.reason ?? '').trim(),
      }))

    return NextResponse.json(items)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
