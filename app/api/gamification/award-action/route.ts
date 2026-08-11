import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import {
  DAILY_POINT_CAP,
  XP_REWARDS,
  awardCompletedMissionBonuses,
  checkAndAwardBadges,
  streakBonus,
  type ActionEvent,
} from '@/lib/gamification'
import { createHash } from 'crypto'

function makeEventId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16)
}

const DAILY_EVENTS: ActionEvent[] = ['chunk_analyzed', 'video_studied', 'music_studied']

const DAILY_CAPS: Partial<Record<ActionEvent, number>> = {
  chunk_saved:    8 * 20,
  word_looked_up: 5 * 30,
  takeaway_created: 15 * 10,
  glossary_example_created: 30 * 10,
  speaking_practiced: 15 * 20,
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { event: ActionEvent; eventId?: string; metadata?: Record<string, unknown> }
    const { event } = body

    if (!event || !(event in XP_REWARDS)) {
      return NextResponse.json({ error: 'Invalid event type.' }, { status: 400 })
    }

    const admin = getAdminClient()
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    const suppliedEventId = body.eventId?.trim().slice(0, 240)
    const eventId = suppliedEventId
      ? makeEventId(user.id, event, suppliedEventId)
      : (DAILY_EVENTS.includes(event)
        ? makeEventId(user.id, event, todayStr)
        : makeEventId(user.id, event, now.toISOString()))

    // Per-day cap check for repeatable events
    if (DAILY_CAPS[event] !== undefined) {
      const { data: todayRows } = await admin
        .from('points_history')
        .select('points')
        .eq('user_id', user.id)
        .eq('event_type', event)
        .gte('event_ts', `${todayStr}T00:00:00Z`)
      const todayTotal = ((todayRows ?? []) as { points: number }[])
        .reduce((s, r) => s + r.points, 0)
      if (todayTotal >= (DAILY_CAPS[event] as number)) {
        return NextResponse.json({ points: 0, newTotal: 0, badgesAwarded: [], capped: true })
      }
    }

    const { data: todayPointRows } = await admin
      .from('points_history')
      .select('points')
      .eq('user_id', user.id)
      .gte('event_ts', `${todayStr}T00:00:00Z`)
    const earnedToday = ((todayPointRows ?? []) as { points: number }[])
      .reduce((sum, row) => sum + row.points, 0)
    const points = Math.min(XP_REWARDS[event], Math.max(0, DAILY_POINT_CAP - earnedToday))
    if (points <= 0) {
      return NextResponse.json({ points: 0, newTotal: 0, badgesAwarded: [], capped: true })
    }

    const { error: insertError } = await admin
      .from('points_history')
      .insert({
        user_id:    user.id,
        event_type: event,
        points,
        metadata:   body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
        event_id:   eventId,
        event_ts:   now.toISOString(),
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ points: 0, newTotal: 0, badgesAwarded: [], duplicate: true })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update user_stats
    const { data: statsRow } = await admin
      .from('user_stats')
      .select('points, streak, total_reviews, last_active')
      .eq('user_id', user.id)
      .single()

    const prevPoints        = (statsRow?.points        as number) ?? 0
    const prevStreak        = (statsRow?.streak        as number) ?? 0
    const prevTotalReviews  = (statsRow?.total_reviews as number) ?? 0
    const lastActiveStr     = statsRow?.last_active
      ? new Date(statsRow.last_active as string).toISOString().slice(0, 10)
      : null

    const isFirstToday = lastActiveStr !== todayStr
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    const newStreak = isFirstToday
      ? (lastActiveStr === yesterdayStr ? prevStreak + 1 : 1)
      : prevStreak

    let bonusPoints = 0
    if (isFirstToday) {
      const bonus = streakBonus(newStreak)
      if (bonus > 0 && streakBonus(prevStreak) < bonus) {
        bonusPoints = bonus
        await admin.from('points_history').insert({
          user_id:    user.id,
          event_type: 'streak_bonus',
          points:     bonus,
          metadata:   { streak: newStreak },
          event_id:   makeEventId(user.id, 'streak_bonus', todayStr),
          event_ts:   now.toISOString(),
        })
      }
    }

    const missionBonus = await awardCompletedMissionBonuses(admin, user.id, event, todayStr)
    const newTotal = prevPoints + points + bonusPoints + missionBonus.points

    await admin.from('user_stats').upsert({
      user_id:       user.id,
      points:        newTotal,
      streak:        newStreak,
      total_reviews: prevTotalReviews,
      last_active:   now.toISOString(),
    }, { onConflict: 'user_id' })

    const badgesAwarded = await checkAndAwardBadges(admin, user.id, {
      points: newTotal,
      streak: newStreak,
      totalReviews: prevTotalReviews,
    })

    return NextResponse.json({
      points: points + bonusPoints + missionBonus.points,
      newTotal,
      badgesAwarded,
      missionsCompleted: missionBonus.missionIds,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
