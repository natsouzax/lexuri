import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPremiumStatus, getWeeklyUsage, incrementWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'
import { analyzeChunks } from '@/lib/chunks'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ isPremium }, usage] = await Promise.all([
      getUserPremiumStatus(user.id),
      getWeeklyUsage(user.id),
    ])

    if (!isPremium && usage.chunkAnalyses >= FREE_LIMITS.weeklyChunkAnalyses) {
      return NextResponse.json(
        {
          error: `Free plan limit reached. You can run ${FREE_LIMITS.weeklyChunkAnalyses} chunk analyses per week. Upgrade to Premium for unlimited access.`,
          limitReached: true,
          upgradeUrl: '/plans',
        },
        { status: 403 },
      )
    }

    const body = (await request.json()) as { text: string; level?: string }
    const { text, level = 'B1' } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('native_language, current_level')
      .eq('user_id', user.id)
      .maybeSingle()

    const nativeLang = (onboarding?.native_language as string | null) ?? 'Portuguese'
    const userLevel = (level !== 'B1' ? level : (onboarding?.current_level as string | null)) ?? 'B1'

    const result = await analyzeChunks(text, userLevel, nativeLang)

    if (!isPremium) {
      await incrementWeeklyUsage(user.id, 'chunk_analyses')
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
