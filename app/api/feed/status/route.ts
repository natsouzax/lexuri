import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { FEED_ITEMS } from '@/lib/feed'
import { STATIC_LESSONS } from '@/data/featured-lessons'

// Diz quais itens do feed já têm lição pronta (estática, cache de
// feed_lessons, ou transcript já capturado) vs quais ainda dependem de
// alguém assistir no YouTube com a extensão pra destravar.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  const ids = FEED_ITEMS.map((i) => i.id)
  const youtubeIds = FEED_ITEMS.map((i) => i.youtube_id)

  const [{ data: lessons }, { data: cached }] = await Promise.all([
    admin.from('feed_lessons').select('feed_item_id').in('feed_item_id', ids),
    admin.from('youtube_transcript_cache').select('video_id').in('video_id', youtubeIds),
  ])

  const readyIds = new Set<string>(Object.keys(STATIC_LESSONS))
  for (const row of lessons ?? []) readyIds.add(row.feed_item_id as string)

  const cachedVideoIds = new Set((cached ?? []).map((r) => r.video_id as string))
  for (const item of FEED_ITEMS) {
    if (cachedVideoIds.has(item.youtube_id)) readyIds.add(item.id)
  }

  return NextResponse.json({ ready: Array.from(readyIds) })
}
