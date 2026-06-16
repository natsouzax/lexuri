import { getAdminClient } from './supabase'

export interface PremiumStatus {
  isPremium: boolean
  source: 'stripe' | 'coupon' | 'none'
  expiresAt: Date | null
}

export const FREE_LIMITS = {
  weeklyYoutubeImports: 5,
  weeklyChunkAnalyses: 10,
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
      .select('premium_until')
      .eq('id', userId)
      .maybeSingle(),
  ])

  if (sub?.status === 'active' || sub?.status === 'trialing') {
    return {
      isPremium: true,
      source: 'stripe',
      expiresAt: sub.current_period_end ? new Date(sub.current_period_end) : null,
    }
  }

  if (profile?.premium_until) {
    const until = new Date(profile.premium_until)
    if (until > new Date()) {
      return { isPremium: true, source: 'coupon', expiresAt: until }
    }
  }

  return { isPremium: false, source: 'none', expiresAt: null }
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
    .select('week_start, yt_imports, chunk_analyses')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data || data.week_start < weekStart) {
    return { ytImports: 0, chunkAnalyses: 0 }
  }

  return { ytImports: data.yt_imports as number, chunkAnalyses: data.chunk_analyses as number }
}

export async function incrementWeeklyUsage(
  userId: string,
  field: 'yt_imports' | 'chunk_analyses',
): Promise<void> {
  const supabase = getAdminClient()
  const weekStart = getWeekStart()

  const { data: existing } = await supabase
    .from('user_weekly_usage')
    .select('week_start, yt_imports, chunk_analyses')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing || existing.week_start < weekStart) {
    await supabase.from('user_weekly_usage').upsert(
      {
        user_id: userId,
        week_start: weekStart,
        yt_imports: field === 'yt_imports' ? 1 : 0,
        chunk_analyses: field === 'chunk_analyses' ? 1 : 0,
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
