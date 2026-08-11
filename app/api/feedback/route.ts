import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import { enforceDailyQuota, QuotaExceededError } from '@/lib/rate-limit'

type FeedbackType = 'bug' | 'suggestion' | 'other'
const VALID_TYPES: FeedbackType[] = ['bug', 'suggestion', 'other']

// Authenticated feedback avoids exposing a public database write through the
// browser's anon key and makes account deletion reliable.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to send feedback.' }, { status: 401 })

    const body = (await request.json()) as { type?: string; message?: string }
    const type: FeedbackType = VALID_TYPES.includes(body.type as FeedbackType)
      ? (body.type as FeedbackType)
      : 'other'
    const message = String(body.message ?? '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Write a message before sending.' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    await enforceDailyQuota(user.id, 'feedback')

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type,
      message,
      email: user.email ?? null,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message, code: 'DAILY_LIMIT' }, { status: 429 })
    }
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
