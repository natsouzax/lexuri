import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const window = searchParams.get('window') ?? 'alltime'  // weekly | monthly | alltime
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit  = 20
  const offset = (page - 1) * limit

  const admin = getAdminClient()

  if (window === 'alltime') {
    // All-time: read from user_stats
    const { data: rows, error } = await admin
      .from('user_stats')
      .select('user_id, points, streak, total_reviews')
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const ranked = (rows ?? []).map((r: { user_id: string; points: number; streak: number; total_reviews: number }, i: number) => ({
      rank:          offset + i + 1,
      user_id:       r.user_id,
      points:        r.points,
      streak:        r.streak,
      total_reviews: r.total_reviews,
      is_me:         r.user_id === user.id,
    }))

    // Fetch display names
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', ranked.map(r => r.user_id))
    const nameMap = new Map((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]))
    const entries = ranked.map(r => ({ ...r, display_name: nameMap.get(r.user_id) ?? null }))

    // Find current user position if not on this page
    let myRank: number | null = null
    const myEntry = entries.find(r => r.is_me)
    if (!myEntry) {
      const { count } = await admin
        .from('user_stats')
        .select('user_id', { count: 'exact', head: true })
        .gt('points', (await admin.from('user_stats').select('points').eq('user_id', user.id).single()).data?.points ?? 0)
      myRank = (count ?? 0) + 1
    }

    return NextResponse.json({ window, page, entries, my_rank: myEntry?.rank ?? myRank })
  }

  // Windowed: sum points_history for the given period
  const now  = new Date()
  let since: string
  if (window === 'weekly') {
    const d = new Date(now); d.setDate(d.getDate() - 7); since = d.toISOString()
  } else {
    const d = new Date(now); d.setDate(d.getDate() - 30); since = d.toISOString()
  }

  const { data: rows, error } = await admin
    .from('points_history')
    .select('user_id, points')
    .gte('event_ts', since)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate in-memory (acceptable for reasonable user counts)
  const agg = new Map<string, number>()
  for (const r of (rows ?? [])) {
    agg.set(r.user_id, (agg.get(r.user_id) ?? 0) + r.points)
  }

  const sorted = [...agg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(offset, offset + limit)
    .map(([uid, pts], i) => ({
      rank:    offset + i + 1,
      user_id: uid,
      points:  pts,
      is_me:   uid === user.id,
    }))

  // Fetch display names
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', sorted.map(r => r.user_id))
  const nameMap = new Map((profiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]))
  const entries = sorted.map(r => ({ ...r, display_name: nameMap.get(r.user_id) ?? null }))

  const meIdx = [...agg.entries()].sort((a, b) => b[1] - a[1]).findIndex(([uid]) => uid === user.id)
  const myRank = entries.find(r => r.is_me)?.rank ?? (meIdx >= 0 ? meIdx + 1 : null)

  return NextResponse.json({ window, page, entries, my_rank: myRank })
}
