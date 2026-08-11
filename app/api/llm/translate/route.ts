import { NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'
import { enforceDailyQuota, QuotaExceededError } from '@/lib/rate-limit'
import { errorMessage } from '@/lib/http'

// Endpoint dedicado pro hover — só a tradução, texto puro.
//
// Exige login desde 2026-08: era público pra alimentar o tradutor flutuante da
// landing, o que deixava a chave da OpenAI acessível a qualquer um da internet
// num loop. O tradutor saiu da landing; dentro do app o usuário já está logado.
const MAX_LEN = 200

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
    if (word.length > MAX_LEN) {
      return NextResponse.json({ error: 'Text too long.' }, { status: 400 })
    }

    await enforceDailyQuota(user.id, 'translate')

    // Idioma vem da escolha do popup (client); fallback Portuguese.
    const nativeLang = body.native_lang?.trim() || 'Portuguese'

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 40,
      messages: [
        {
          role: 'system',
          content: `Translate the given English word or phrase to ${nativeLang}. Reply with ONLY the translation — no quotes, no punctuation, no explanation, nothing else.`,
        },
        {
          role: 'user',
          content: `"${word}"${context ? ` (in context: "${context}")` : ''}`,
        },
      ],
      temperature: 0.2,
    })

    const translation = response.choices[0].message.content?.trim().replace(/^["']|["']$/g, '') ?? ''

    if (!translation) {
      return NextResponse.json({ error: 'Invalid AI response.' }, { status: 500 })
    }

    return NextResponse.json({ translation })
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return NextResponse.json({ error: e.message, code: 'DAILY_LIMIT' }, { status: 429 })
    }
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
