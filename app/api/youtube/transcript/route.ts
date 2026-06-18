import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPremiumStatus, getWeeklyUsage, incrementWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'
import { getTranscript } from '@/lib/youtube'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ isPremium }, usage] = await Promise.all([
      getUserPremiumStatus(user.id),
      getWeeklyUsage(user.id),
    ])

    const body = (await request.json()) as { url: string; feedItem?: boolean }
    if (!body.url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })

    const isFeed = !!body.feedItem

    if (!isPremium) {
      if (isFeed && usage.feedItems >= FREE_LIMITS.feedItems) {
        return NextResponse.json(
          {
            error: `Free plan limit reached. You can open ${FREE_LIMITS.feedItems} curated lessons per week. Upgrade to Premium for unlimited access.`,
            limitReached: true,
            upgradeUrl: '/plans',
          },
          { status: 403 },
        )
      }
      if (!isFeed && usage.ytImports >= FREE_LIMITS.weeklyYoutubeImports) {
        return NextResponse.json(
          {
            error: `Free plan limit reached. You can import ${FREE_LIMITS.weeklyYoutubeImports} YouTube videos per week. Upgrade to Premium for unlimited access.`,
            limitReached: true,
            upgradeUrl: '/plans',
          },
          { status: 403 },
        )
      }
    }

    const data = await getTranscript(body.url)

    if (!isPremium) {
      await incrementWeeklyUsage(user.id, isFeed ? 'feed_opens' : 'yt_imports')
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
