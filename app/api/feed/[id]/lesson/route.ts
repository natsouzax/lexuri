import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getFeedItem } from '@/lib/feed'
import { getStaticLesson } from '@/data/featured-lessons'

// MVP de validação: só lições estáticas pré-geradas — zero DB/AI em runtime.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const staticLesson = getStaticLesson(id)
    if (!staticLesson) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
    }

    const item = getFeedItem(id)
    return NextResponse.json({
      video_id: staticLesson.video_id,
      title: item?.title ?? '',
      transcript: staticLesson.transcript,
      segments: staticLesson.segments,
      original_text: staticLesson.transcript,
      chunks: staticLesson.chunks,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
