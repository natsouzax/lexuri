import { NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'

// Endpoint dedicado pro hover — só a tradução, texto puro (sem JSON, sem
// risco de corte no meio da estrutura). /api/llm/define gera definição +
// exemplo + tradução de uma vez (necessário pra salvar o flashcard), o que
// sempre vai ser mais lento do que precisa ser só pra mostrar uma dica
// rápida ao passar o mouse.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { word: string; context?: string }
    const { word, context = '' } = body

    if (!word?.trim()) {
      return NextResponse.json({ error: 'Word is required.' }, { status: 400 })
    }

    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('native_language')
      .eq('user_id', user.id)
      .maybeSingle()

    const nativeLang = (onboarding?.native_language as string | null) ?? 'Portuguese'

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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
