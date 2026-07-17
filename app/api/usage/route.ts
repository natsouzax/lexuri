import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPremiumStatus, getWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ isPremium, planKey }, usage] = await Promise.all([
      getUserPremiumStatus(user.id),
      getWeeklyUsage(user.id),
    ])

    return NextResponse.json({
      isPremium,
      planKey,
      ytImports: usage.ytImports,
      musicImports: usage.musicImports,
      feedItems: usage.feedItems,
      limits: FREE_LIMITS,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
