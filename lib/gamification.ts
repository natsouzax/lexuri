/**
 * Server-side gamification logic.
 * All point calculations happen here — never trust client-supplied points.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const DAILY_POINT_CAP = 2000

export interface ReviewInput {
  quality: number      // 0-5 (SM-2 scale)
  responseTimeSec?: number
}

export interface PointResult {
  points: number
  breakdown: string[]
}

/** Pure function — calculates points for a single review. No DB calls. */
export function calcReviewPoints(input: ReviewInput): PointResult {
  const { quality, responseTimeSec } = input
  const breakdown: string[] = []

  if (quality < 3) return { points: 0, breakdown: ['Quality < 3 → 0 pts'] }

  let base = 10
  breakdown.push(`Base: ${base} pts`)

  const qualityMult = quality === 5 ? 1.5 : quality === 4 ? 1.2 : 1.0
  base = Math.round(base * qualityMult)
  if (qualityMult !== 1) breakdown.push(`Quality ×${qualityMult} → ${base} pts`)

  if (responseTimeSec !== undefined) {
    if (responseTimeSec < 10) {
      base = Math.round(base * 1.1)
      breakdown.push(`Speed bonus (<10s) → ${base} pts`)
    } else if (responseTimeSec > 60) {
      base = Math.round(base * 0.8)
      breakdown.push(`Speed penalty (>60s) → ${base} pts`)
    }
  }

  return { points: base, breakdown }
}

/** Streak bonuses awarded once per milestone crossing. */
export function streakBonus(streak: number): number {
  if (streak >= 30) return 250
  if (streak >= 14) return 100
  if (streak >= 7)  return 50
  return 0
}

/**
 * Award points for a review + update user_stats + emit points_history row.
 * Idempotent: if event_id already exists the INSERT is silently skipped.
 */
export async function awardReviewPoints(
  admin: SupabaseClient,
  userId: string,
  input: ReviewInput,
  eventId: string,
): Promise<{ points: number; newTotal: number; badgesAwarded: string[] }> {
  const { points, breakdown } = calcReviewPoints(input)

  // Fetch current stats
  const { data: statsRow } = await admin
    .from('user_stats')
    .select('points, streak, total_reviews, last_active')
    .eq('user_id', userId)
    .single()

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const lastActiveStr = statsRow?.last_active
    ? new Date(statsRow.last_active).toISOString().slice(0, 10)
    : null

  const isFirstToday = lastActiveStr !== todayStr
  const prevStreak: number = statsRow?.streak ?? 0
  const prevPoints: number = statsRow?.points ?? 0
  const prevTotal: number = statsRow?.total_reviews ?? 0

  // Calculate new streak
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)
  const newStreak = isFirstToday
    ? (lastActiveStr === yesterdayStr ? prevStreak + 1 : 1)
    : prevStreak

  // Bonus for first review of the day
  let totalEarned = points
  if (isFirstToday && points > 0) {
    totalEarned += 5
    breakdown.push('First review of the day +5 pts')
  }

  // Streak bonus (only when milestone newly crossed)
  const bonus = streakBonus(newStreak)
  if (bonus > 0 && streakBonus(prevStreak) < bonus) {
    totalEarned += bonus
    breakdown.push(`Streak ${newStreak} days bonus +${bonus} pts`)
  }

  // Apply daily cap
  const { data: todayPoints } = await admin
    .from('points_history')
    .select('points')
    .eq('user_id', userId)
    .gte('event_ts', `${todayStr}T00:00:00Z`)

  const earnedToday = (todayPoints ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0)
  const allowed = Math.max(0, DAILY_POINT_CAP - earnedToday)
  totalEarned = Math.min(totalEarned, allowed)

  const newTotal = prevPoints + totalEarned
  const newTotalReviews = prevTotal + 1

  // Upsert user_stats (service role — bypasses RLS)
  await admin.from('user_stats').upsert({
    user_id: userId,
    points: newTotal,
    streak: newStreak,
    total_reviews: newTotalReviews,
    last_active: now.toISOString(),
  }, { onConflict: 'user_id' })

  // Record points event (idempotent via UNIQUE event_id)
  if (totalEarned > 0) {
    await admin.from('points_history').insert({
      user_id: userId,
      event_type: 'flashcard_review',
      points: totalEarned,
      metadata: { quality: input.quality, breakdown },
      event_id: eventId,
    }).throwOnError()
  }

  // Check badge eligibility
  const badgesAwarded = await checkAndAwardBadges(admin, userId, {
    totalReviews: newTotalReviews,
    streak: newStreak,
    points: newTotal,
  })

  return { points: totalEarned, newTotal, badgesAwarded }
}

interface StatSnapshot {
  totalReviews: number
  streak: number
  points: number
}

async function checkAndAwardBadges(
  admin: SupabaseClient,
  userId: string,
  stats: StatSnapshot,
): Promise<string[]> {
  const { data: allBadges } = await admin.from('badges').select('id, key, criteria')
  const { data: earned } = await admin.from('user_badges').select('badge_id').eq('user_id', userId)
  const earnedIds = new Set((earned ?? []).map((r: { badge_id: string }) => r.badge_id))

  const awarded: string[] = []
  for (const badge of (allBadges ?? [])) {
    if (earnedIds.has(badge.id)) continue

    const c = badge.criteria as Record<string, number>
    const qualifies =
      (c.total_reviews !== undefined && stats.totalReviews >= c.total_reviews) ||
      (c.streak       !== undefined && stats.streak       >= c.streak)        ||
      (c.points       !== undefined && stats.points       >= c.points)

    if (qualifies) {
      const { error } = await admin.from('user_badges').insert({ badge_id: badge.id, user_id: userId })
      if (!error) awarded.push(badge.key)
    }
  }

  return awarded
}
