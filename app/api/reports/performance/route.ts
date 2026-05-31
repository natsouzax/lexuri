import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('user_id') ?? user.id
  // Only allow querying own data (unless implementing admin role later)
  if (targetUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const admin = getAdminClient()

  // Flashcard reviews within the window
  let query = admin
    .from('analytics_events')
    .select('payload, ts')
    .eq('user_id', targetUserId)
    .eq('event_name', 'flashcard_review')

  if (from) query = query.gte('ts', from)
  if (to)   query = query.lte('ts', to)

  const { data: events, error } = await query.order('ts', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (events ?? []) as Array<{ payload: Record<string, unknown>; ts: string }>

  const total = rows.length
  const correct = rows.filter(r => Number(r.payload.quality ?? 0) >= 3).length
  const taxa_acerto = total > 0 ? Math.round((correct / total) * 100) : 0

  const times = rows
    .map(r => Number(r.payload.response_time_sec))
    .filter(t => !isNaN(t) && t > 0)
  const tempo_medio = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null

  // Retention: cards answered correctly after >= 1 previous review (simplified)
  const cardSeen = new Map<string, number>()
  let retentionCorrect = 0, retentionTotal = 0
  for (const r of rows) {
    const id = r.payload.card_id as string | undefined
    if (!id) continue
    const prev = cardSeen.get(id) ?? 0
    if (prev > 0) {
      retentionTotal++
      if (Number(r.payload.quality) >= 3) retentionCorrect++
    }
    cardSeen.set(id, prev + 1)
  }
  const retention = retentionTotal > 0
    ? Math.round((retentionCorrect / retentionTotal) * 100)
    : null

  // Streak from user_stats
  const { data: statsRow } = await admin
    .from('user_stats')
    .select('streak, points, total_reviews')
    .eq('user_id', targetUserId)
    .single()

  return NextResponse.json({
    period: { from: from ?? null, to: to ?? null },
    total_reviews:  total,
    taxa_acerto,
    tempo_medio,
    retention,
    streak:         statsRow?.streak         ?? 0,
    total_points:   statsRow?.points         ?? 0,
    total_reviews_alltime: statsRow?.total_reviews ?? 0,
  })
}
