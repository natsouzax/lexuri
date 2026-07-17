/**
 * LMS Integration — sync endpoint.
 *
 * Exports user progress to a configured LMS via REST.
 * Set LMS_API_URL + LMS_API_KEY in your environment.
 *
 * Conflict policy: last-write-wins on progress data.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const lmsUrl = process.env.LMS_API_URL
  const lmsKey = process.env.LMS_API_KEY

  if (!lmsUrl) {
    return NextResponse.json({ error: 'LMS_API_URL is not configured' }, { status: 501 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()

  const [{ data: stats }, { data: flashcards }] = await Promise.all([
    admin.from('user_stats').select('*').eq('user_id', user.id).single(),
    admin.from('flashcards').select('id, word, interval, repetitions, ease_factor, last_reviewed').eq('user_id', user.id),
  ])

  const payload = {
    user_id:    user.id,
    email:      user.email,
    synced_at:  new Date().toISOString(),
    stats:      stats ?? {},
    flashcards: (flashcards ?? []).map(f => ({
      id:           f.id,
      word:         f.word,
      interval:     f.interval,
      repetitions:  f.repetitions,
      ease_factor:  f.ease_factor,
      last_reviewed: f.last_reviewed,
    })),
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (lmsKey) headers['Authorization'] = `Bearer ${lmsKey}`

  const body = await req.json().catch(() => ({})) as { direction?: string }
  const direction = body.direction ?? 'export'

  if (direction === 'export') {
    const res = await fetch(`${lmsUrl}/progress`, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `LMS returned ${res.status}: ${text}` }, { status: 502 })
    }
    return NextResponse.json({ ok: true, exported: payload.flashcards.length })
  }

  if (direction === 'import') {
    const res = await fetch(`${lmsUrl}/progress/${user.id}`, { headers })
    if (!res.ok) {
      return NextResponse.json({ error: `LMS returned ${res.status}` }, { status: 502 })
    }
    const lmsData = await res.json() as { progress?: Array<{ word: string; mastered: boolean }> }
    return NextResponse.json({ ok: true, imported: lmsData.progress?.length ?? 0 })
  }

  return NextResponse.json({ error: 'direction must be export|import' }, { status: 400 })
}
