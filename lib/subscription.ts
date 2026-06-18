import { getAdminClient } from './supabase'

export interface PremiumStatus {
  isPremium: boolean
  planKey: 'free' | 'pro' | 'lifetime'
  source: 'stripe' | 'coupon' | 'lifetime' | 'none'
  expiresAt: Date | null
}

export const FREE_LIMITS = {
  weeklyYoutubeImports: 5,
  weeklyMusicImports: 5,
  weeklyChunkAnalyses: 10,
  feedItems: 5,
} as const

export async function getUserPremiumStatus(userId: string): Promise<PremiumStatus> {
  const supabase = getAdminClient()

  const [{ data: sub }, { data: profile }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('premium_until, plan_key')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (sub?.status === 'active' || sub?.status === 'trialing') {
    return {
      isPremium: true,
      planKey: 'pro',
      source: 'stripe',
      expiresAt: sub.current_period_end ? new Date(sub.current_period_end) : null,
    }
  }

  if (profile?.plan_key === 'lifetime') {
    return { isPremium: true, planKey: 'lifetime', source: 'lifetime', expiresAt: null }
  }

  if (profile?.premium_until) {
    const until = new Date(profile.premium_until)
    if (until > new Date()) {
      return { isPremium: true, planKey: 'pro', source: 'coupon', expiresAt: until }
    }
  }

  return { isPremium: false, planKey: 'free', source: 'none', expiresAt: null }
}

function getWeekStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

export async function getWeeklyUsage(userId: string) {
  const supabase = getAdminClient()
  const weekStart = getWeekStart()

  const { data } = await supabase
    .from('user_weekly_usage')
    .select('week_start, yt_imports, music_imports, chunk_analyses, feed_opens')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data || data.week_start < weekStart) {
    return { ytImports: 0, musicImports: 0, chunkAnalyses: 0, feedItems: 0 }
  }

  return {
    ytImports: data.yt_imports as number,
    musicImports: (data.music_imports as number) ?? 0,
    chunkAnalyses: data.chunk_analyses as number,
    feedItems: (data.feed_opens as number) ?? 0,
  }
}

export async function incrementWeeklyUsage(
  userId: string,
  field: 'yt_imports' | 'music_imports' | 'chunk_analyses' | 'feed_opens',
): Promise<void> {
  const supabase = getAdminClient()
  const weekStart = getWeekStart()

  const { data: existing } = await supabase
    .from('user_weekly_usage')
    .select('week_start, yt_imports, music_imports, chunk_analyses, feed_opens')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing || existing.week_start < weekStart) {
    await supabase.from('user_weekly_usage').upsert(
      {
        user_id: userId,
        week_start: weekStart,
        yt_imports: field === 'yt_imports' ? 1 : 0,
        music_imports: field === 'music_imports' ? 1 : 0,
        chunk_analyses: field === 'chunk_analyses' ? 1 : 0,
        feed_opens: field === 'feed_opens' ? 1 : 0,
      },
      { onConflict: 'user_id' },
    )
  } else {
    const current = existing[field] as number
    await supabase
      .from('user_weekly_usage')
      .update({ [field]: current + 1 })
      .eq('user_id', userId)
  }
}
