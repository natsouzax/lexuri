import { NextResponse } from 'next/server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import { normalizeFlashcard } from '@/lib/types'
import { createClient } from '@/lib/supabase-server'

async function getNativeLanguage(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('onboarding')
    .select('native_language')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.native_language as string | null) ?? 'Portuguese'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { word: string }
    const word = body.word?.trim()
    if (!word) return NextResponse.json({ error: 'Word cannot be empty.' }, { status: 400 })

    const nativeLang = await getNativeLanguage(user.id)

    const prompt = `Generate a flashcard for the English word: "${word}"

Return ONLY valid JSON:
{
  "word": "${word}",
  "translation": "${nativeLang} translation",
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
