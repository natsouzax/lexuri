import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

interface SendBody {
  user_id: string
  title: string
  body?: string
  data?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only service-role callers (admin) can send to arbitrary user_ids.
  // Regular users can only send to themselves (e.g., self-test).
  let body: SendBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const targetUserId = body.user_id ?? user.id

  const admin = getAdminClient()
  const { data, error } = await admin.from('notifications').insert({
    user_id: targetUserId,
    title:   body.title.trim(),
    body:    body.body?.trim() ?? '',
    data:    body.data ?? {},
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notification: data })
}
