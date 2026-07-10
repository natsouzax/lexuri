import { after, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPremiumStatus, getWeeklyUsage, incrementWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'
import {
  getTranscriptFast,
  reviewAndCleanSegments,
  splitAtSentenceBoundaries,
  updateTranscriptCache,
} from '@/lib/media/youtube'

function scheduleRepair(videoId: string, mergedSegments: Parameters<typeof reviewAndCleanSegments>[0]) {
  after(async () => {
    try {
      const cleaned  = await reviewAndCleanSegments(mergedSegments)
      const segments = splitAtSentenceBoundaries(cleaned)
      await updateTranscriptCache(videoId, segments)
    } catch (e) {
      console.error('[transcript-repair] background repair failed:', e)
    }
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { url: string; feedItem?: boolean }
    if (!body.url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })

    const isFeed = !!body.feedItem

    let isPremiumUser = true
    if (!isFeed) {
      const [{ isPremium }, usage] = await Promise.all([
        getUserPremiumStatus(user.id),
        getWeeklyUsage(user.id),
      ])

      if (!isPremium && usage.ytImports >= FREE_LIMITS.weeklyYoutubeImports) {
        return NextResponse.json(
          {
            error: `Free plan limit reached. You can import ${FREE_LIMITS.weeklyYoutubeImports} YouTube videos per week. Upgrade to Premium for unlimited access.`,
            limitReached: true,
            upgradeUrl: '/plans',
          },
          { status: 403 },
        )
      }

      isPremiumUser = isPremium
    }

    const { data, videoId, mergedSegments, needsRepair } = await getTranscriptFast(body.url)

    if (!isFeed && !isPremiumUser) await incrementWeeklyUsage(user.id, 'yt_imports')
    if (needsRepair) scheduleRepair(videoId, mergedSegments)

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
