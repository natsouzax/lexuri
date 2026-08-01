import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

const SKIP_FOR_HOURS = 4

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const now = new Date()
    const nextReviewAt = new Date(now.getTime() + SKIP_FOR_HOURS * 60 * 60 * 1000)
    const { data: item, error } = await supabase
      .from('speaking_review_items')
      .update({
        next_review_at: nextReviewAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, next_review_at')
      .maybeSingle()
    if (error) throw error
    if (!item) return NextResponse.json({ error: 'Speaking-review word not found.' }, { status: 404 })

    return NextResponse.json({
      id: item.id,
      nextReviewAt: item.next_review_at,
      skippedForHours: SKIP_FOR_HOURS,
    })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

