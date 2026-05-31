import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import type { AnalyticsEventName } from '@/lib/analytics'

const ALLOWED_EVENTS: AnalyticsEventName[] = [
  'flashcard_review',
  'session_start',
  'session_end',
  'payment_complete',
  'video_sync_play',
  'chunk_detected',
  'flashcard_created',
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { event: string; payload?: Record<string, unknown> }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!ALLOWED_EVENTS.includes(body.event as AnalyticsEventName)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  const admin = getAdminClient()
  await admin.from('analytics_events').insert({
    user_id:    user.id,
    event_name: body.event,
    payload:    body.payload ?? {},
  })

  return NextResponse.json({ ok: true })
}
