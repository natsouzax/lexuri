import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { getUserPremiumStatus, getWeeklyUsage, incrementWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'
import { getTranscript } from '@/lib/youtube'
import { analyzeChunks } from '@/lib/chunks'
import { getFeedItem } from '@/lib/feed'
import { getStaticLesson } from '@/data/featured-lessons'
import type { TranscriptSegment, ChunkItem } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Static featured lesson — zero DB/AI calls, no quota cost ─────────────
    const staticLesson = getStaticLesson(id)
    if (staticLesson) {
      const item = getFeedItem(id)
      return NextResponse.json({
        video_id: staticLesson.video_id,
        title: item?.title ?? '',
        transcript: staticLesson.transcript,
        segments: staticLesson.segments,
        original_text: staticLesson.transcript,
        chunks: staticLesson.chunks,
      })
    }

    const [{ isPremium }, usage] = await Promise.all([
      getUserPremiumStatus(user.id),
      getWeeklyUsage(user.id),
    ])

    if (!isPremium && usage.feedItems >= FREE_LIMITS.feedItems) {
      return NextResponse.json(
        {
          error: `Free plan limit reached. You can open ${FREE_LIMITS.feedItems} curated lessons per week. Upgrade to Premium for unlimited access.`,
          limitReached: true,
          upgradeUrl: '/plans',
        },
        { status: 403 },
      )
    }

    const admin = getAdminClient()

    // Native language from onboarding — cache key for chunks (language-specific translations)
    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('native_language')
      .eq('user_id', user.id)
      .maybeSingle()
    const nativeLang = (onboarding?.native_language as string | null) ?? 'Portuguese'

    // Feed item metadata
    const { data: feedItem } = await admin
      .from('feed_items')
      .select('youtube_id, title')
      .eq('id', id)
      .maybeSingle()

    if (!feedItem) return NextResponse.json({ error: 'Feed item not found.' }, { status: 404 })

    // ── Transcript cache ──────────────────────────────────────────────────────
    let transcript: string
    let segments: TranscriptSegment[]
    let chunksWereCached: boolean

    const { data: cachedLesson } = await admin
      .from('feed_lessons')
      .select('transcript, segments')
      .eq('feed_item_id', id)
      .maybeSingle()

    if (cachedLesson) {
      transcript = cachedLesson.transcript
      segments = cachedLesson.segments as TranscriptSegment[]
    } else {
      let videoData
      try {
        videoData = await getTranscript(
          `https://www.youtube.com/watch?v=${feedItem.youtube_id}`,
        )
      } catch {
        // Caption extraction failed — return unverified signal instead of 500
        if (!isPremium) await incrementWeeklyUsage(user.id, 'feed_opens')
        return NextResponse.json({
          video_id: feedItem.youtube_id,
          title: feedItem.title,
          unverified: true,
          transcript: '',
          segments: [],
          original_text: '',
          chunks: [],
        })
      }

      transcript = videoData.transcript
      segments = videoData.segments

      // Persist async — don't block the response
      void Promise.resolve(
        admin.from('feed_lessons').upsert({ feed_item_id: id, transcript, segments }),
      ).catch((e: unknown) => console.error('[feed-lesson] transcript cache write failed:', e))
    }

    // ── Chunk cache ───────────────────────────────────────────────────────────
    // Chunks are universal (all CEFR levels detected in one pass), cached per feed_item + native_lang
    let chunks: ChunkItem[]

    const { data: cachedChunks } = await admin
      .from('feed_lesson_chunks')
      .select('chunks')
      .eq('feed_item_id', id)
      .eq('native_lang', nativeLang)
      .maybeSingle()

    if (cachedChunks) {
      chunks = cachedChunks.chunks as ChunkItem[]
      chunksWereCached = true
    } else {
      const analysis = await analyzeChunks(transcript, nativeLang)
      chunks = analysis.chunks
      chunksWereCached = false

      void Promise.resolve(
        admin.from('feed_lesson_chunks').upsert({ feed_item_id: id, native_lang: nativeLang, chunks, original_text: transcript }),
      ).catch((e: unknown) => console.error('[feed-lesson] chunks cache write failed:', e))
    }

    // ── Quota tracking ────────────────────────────────────────────────────────
    if (!isPremium) {
      await incrementWeeklyUsage(user.id, 'feed_opens')
      if (!chunksWereCached) {
        await incrementWeeklyUsage(user.id, 'chunk_analyses')
      }
    }

    return NextResponse.json({
      video_id: feedItem.youtube_id,
      title: feedItem.title,
      transcript,
      segments,
      original_text: transcript,
      chunks,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
