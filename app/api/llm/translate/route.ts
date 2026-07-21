import { NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai'
import { errorMessage } from '@/lib/http'

// Endpoint dedicado pro hover — só a tradução, texto puro. Público (sem
// login): também alimenta o tradutor flutuante na landing de marketing.
// Limitado a trechos curtos (palavras/frases) pra evitar abuso/custo.
const MAX_LEN = 200

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { word: string; context?: string; native_lang?: string }
    const { word, context = '' } = body

    if (!word?.trim()) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 })
    }
    if (word.length > MAX_LEN) {
      return NextResponse.json({ error: 'Text too long.' }, { status: 400 })
    }

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
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
