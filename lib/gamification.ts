/**
 * Server-side gamification logic.
 * All point calculations happen here — never trust client-supplied points.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export const DAILY_POINT_CAP = 2000

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

  // Claim the event before changing aggregates. This makes retries harmless,
  // including reviews worth zero points, while still counting them as practice.
  const { error: historyError } = await admin.from('points_history').insert({
    user_id: userId,
    event_type: 'flashcard_review',
    points: totalEarned,
    metadata: { quality: input.quality, breakdown },
    event_id: eventId,
  })

  if (historyError?.code === '23505') {
    return { points: 0, newTotal: prevPoints, badgesAwarded: [] }
  }
  if (historyError) throw historyError

  const newTotalReviews = prevTotal + 1
  const missionBonus = await awardCompletedMissionBonuses(admin, userId, 'flashcard_review', todayStr)
  totalEarned += missionBonus.points
  const newTotal = prevPoints + totalEarned

  // Upsert user_stats only after the immutable event has been accepted.
  const { error: statsError } = await admin.from('user_stats').upsert({
    user_id: userId,
    points: newTotal,
    streak: newStreak,
    total_reviews: newTotalReviews,
    last_active: now.toISOString(),
  }, { onConflict: 'user_id' })
  if (statsError) throw statsError

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

export async function checkAndAwardBadges(
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

// ── Rank system ──────────────────────────────────────────────────────────────

export interface Rank {
  slug: string
  label: string
  icon: string
  color: string
  minXP: number
  maxXP: number | null
}

export const RANKS: Rank[] = [
  { slug: 'seed',     label: 'Seed',     icon: '◎', color: '#9E9E9E', minXP: 0,     maxXP: 199   },
  { slug: 'sprout',   label: 'Sprout',   icon: '◈', color: '#66BB6A', minXP: 200,   maxXP: 699   },
  { slug: 'learner',  label: 'Learner',  icon: '◉', color: '#29B6F6', minXP: 700,   maxXP: 1999  },
  { slug: 'explorer', label: 'Explorer', icon: '◆', color: '#7E57C2', minXP: 2000,  maxXP: 4999  },
  { slug: 'scholar',  label: 'Scholar',  icon: '★', color: '#FF9800', minXP: 5000,  maxXP: 12499 },
  { slug: 'fluent',   label: 'Fluent',   icon: '✦', color: '#c86f4a', minXP: 12500, maxXP: 29999 },
  { slug: 'master',   label: 'Master',   icon: '◈', color: '#E91E63', minXP: 30000, maxXP: null  },
]

export function getRankForXP(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i]
  }
  return RANKS[0]
}

export interface XPProgressInfo {
  rank: Rank
  nextRank: Rank | null
  progressPct: number
  xpIntoRank: number
  xpToNext: number | null
}

export function getXPProgress(xp: number): XPProgressInfo {
  const rank = getRankForXP(xp)
  const idx = RANKS.findIndex((r) => r.slug === rank.slug)
  const nextRank = idx < RANKS.length - 1 ? RANKS[idx + 1] : null

  if (!nextRank) {
    return { rank, nextRank: null, progressPct: 100, xpIntoRank: xp - rank.minXP, xpToNext: null }
  }

  const rangeSize = nextRank.minXP - rank.minXP
  const xpIntoRank = xp - rank.minXP
  const progressPct = Math.min(100, Math.round((xpIntoRank / rangeSize) * 100))

  return { rank, nextRank, progressPct, xpIntoRank, xpToNext: nextRank.minXP - xp }
}

// ── XP rewards & action types ────────────────────────────────────────────────

export const PLACEMENT_COMPLETE_XP = 100

export const XP_REWARDS = {
  chunk_analyzed:   20,
  chunk_saved:       8,
  video_studied:    30,
  music_studied:    20,
  word_looked_up:    5,
  lesson_completed:  30,
  song_review_completed: 20,
  takeaway_created:  15,
  glossary_example_created: 30,
  personal_song_created: 75,
  personal_song_recorded: 100,
  speaking_practiced: 15,
  album_review_completed: 30,
  album_completed: 100,
  mission_complete: 25,
} as const

export type ActionEvent = keyof typeof XP_REWARDS

// ── Daily missions ───────────────────────────────────────────────────────────

export interface Mission {
  id: string
  label: string
  description: string
  icon: string
  xpReward: number
  targetCount: number
  eventType: ActionEvent | 'flashcard_review'
}

// Missões diárias do MVP: refletem o loop real do app (ouvir música →
// salvar palavras da letra → revisar). Sempre em inglês (imersão).
export const DAILY_MISSIONS: Mission[] = [
  { id: 'finish_lesson', label: 'Finish a lesson', description: 'Complete one song lesson', icon: '♪', xpReward: 25, targetCount: 1, eventType: 'lesson_completed' },
  { id: 'save_words', label: 'Save 3 words', description: 'Choose 3 useful words to learn', icon: '◈', xpReward: 25, targetCount: 3, eventType: 'word_looked_up' },
  { id: 'review_cards', label: 'Review 5 cards', description: 'Complete 5 flashcard reviews', icon: '↺', xpReward: 25, targetCount: 5, eventType: 'flashcard_review' },
  { id: 'song_review', label: 'Complete a review step', description: 'Finish one Day 1, 2, or 3 activity', icon: '✓', xpReward: 30, targetCount: 1, eventType: 'song_review_completed' },
  { id: 'personal_example', label: 'Make English yours', description: 'Save one real personal example', icon: '✎', xpReward: 30, targetCount: 1, eventType: 'glossary_example_created' },
  { id: 'speaking_practice', label: 'Practise speaking', description: 'Complete one AI speaking attempt', icon: '●', xpReward: 25, targetCount: 1, eventType: 'speaking_practiced' },
]

export async function awardCompletedMissionBonuses(
  admin: SupabaseClient,
  userId: string,
  eventType: Mission['eventType'],
  todayStr: string,
): Promise<{ points: number; missionIds: string[] }> {
  const missions = DAILY_MISSIONS.filter((mission) => mission.eventType === eventType)
  if (missions.length === 0) return { points: 0, missionIds: [] }

  const { count } = await admin
    .from('points_history')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('event_ts', `${todayStr}T00:00:00Z`)

  let points = 0
  const missionIds: string[] = []
  for (const mission of missions) {
    if ((count ?? 0) < mission.targetCount) continue
    const { error } = await admin.from('points_history').insert({
      user_id: userId,
      event_type: 'mission_complete',
      points: mission.xpReward,
      metadata: { mission_id: mission.id, source_event: eventType },
      event_id: `mission:${userId}:${mission.id}:${todayStr}`,
    })
    if (!error) {
      points += mission.xpReward
      missionIds.push(mission.id)
    }
  }
  return { points, missionIds }
}
