import { NextResponse } from 'next/server'
import { getOpenAIClient, safeJsonParse } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

interface WordDef {
  word: string
  partOfSpeech: string
  definition: string
  example: string
  translation: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { word: string; context?: string; native_lang?: string }
    const { word, context = '' } = body

    if (!word?.trim()) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 })
    }

    // Idioma vem da escolha do popup (client); fallback Portuguese.
    const nativeLang = body.native_lang?.trim() || 'Portuguese'

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are an English vocabulary assistant for ${nativeLang} speakers. Return ONLY valid JSON, as short as possible. No markdown fences. No extra text.`,
        },
        {
          role: 'user',
          content: `Define the English word or phrase "${word}"${context ? ` as used in this lyric: "${context}"` : ''}.

Return exactly this JSON, keeping every field as short as possible (definition ≤ 8 words, example ≤ 10 words):
{
  "word": "${word}",
  "partOfSpeech": "noun|verb|adjective|adverb|phrase|idiom|expression|other",
  "definition": "short, simple definition in English",
  "example": "a short new example sentence using this word",
  "translation": "natural translation in ${nativeLang}"
}`,
        },
      ],
      temperature: 0.3,
    })

    const content = response.choices[0].message.content?.trim() ?? ''
    const parsed = safeJsonParse<WordDef>(content)

    if (!parsed || typeof (parsed as { error?: string }).error === 'string') {
      return NextResponse.json({ error: 'Invalid AI response.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
