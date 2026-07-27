import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

type FeedbackType = 'bug' | 'suggestion' | 'other'
const VALID_TYPES: FeedbackType[] = ['bug', 'suggestion', 'other']

// POST { type, message, email? } — aberto a qualquer um (tester não precisa
// estar logado); se houver sessão, associa o feedback ao usuário.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = (await request.json()) as { type?: string; message?: string; email?: string }
    const type: FeedbackType = VALID_TYPES.includes(body.type as FeedbackType)
      ? (body.type as FeedbackType)
      : 'other'
    const message = String(body.message ?? '').trim()
    const email = String(body.email ?? '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Write a message before sending.' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      type,
      message,
      email: email || null,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
