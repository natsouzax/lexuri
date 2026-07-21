import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { getXPProgress, DAILY_MISSIONS } from '@/lib/gamification'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()

    const { data: statsRow } = await admin
      .from('user_stats')
      .select('points, streak, total_reviews, last_active')
      .eq('user_id', user.id)
      .single()

    const points        = (statsRow?.points        as number) ?? 0
    const streak        = (statsRow?.streak        as number) ?? 0
    const total_reviews = (statsRow?.total_reviews as number) ?? 0
    const last_active   = (statsRow?.last_active   as string | null) ?? null

    const xpProgress = getXPProgress(points)

    // Mission progress — count today's events
    const todayStr = new Date().toISOString().slice(0, 10)
    const { data: todayEvents } = await admin
      .from('points_history')
      .select('event_type')
      .eq('user_id', user.id)
      .gte('event_ts', `${todayStr}T00:00:00Z`)

    const eventCounts: Record<string, number> = {}
    for (const row of (todayEvents ?? [])) {
      const et = row.event_type as string
      eventCounts[et] = (eventCounts[et] ?? 0) + 1
    }

    const missionsToday = DAILY_MISSIONS.map((m) => {
      const progress = Math.min(m.targetCount, eventCounts[m.eventType] ?? 0)
      return { ...m, progress, completed: progress >= m.targetCount }
    })

    // Weekly activity (index 0 = today, index 6 = 6 days ago)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data: weekEvents } = await admin
      .from('points_history')
      .select('event_ts')
      .eq('user_id', user.id)
      .gte('event_ts', sevenDaysAgo.toISOString().slice(0, 10) + 'T00:00:00Z')

    const activeDays = new Set<string>()
    for (const row of (weekEvents ?? [])) {
      activeDays.add(new Date(row.event_ts as string).toISOString().slice(0, 10))
    }

    const weekActivity: boolean[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      weekActivity.push(activeDays.has(d.toISOString().slice(0, 10)))
    }

    // Last 10 XP events for history feed
    const { data: xpHistory } = await admin
      .from('points_history')
      .select('event_type, points, event_ts')
      .eq('user_id', user.id)
      .order('event_ts', { ascending: false })
      .limit(10)

    return NextResponse.json({
      points,
      streak,
      total_reviews,
      last_active,
      rank: xpProgress.rank,
      xpProgress,
      missionsToday,
      weekActivity,
      xpHistory: xpHistory ?? [],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
