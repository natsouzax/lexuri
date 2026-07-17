import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { awardReviewPoints } from '@/lib/gamification'

interface AwardBody {
  quality: number
  responseTimeSec?: number
  eventId: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: AwardBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.quality !== 'number' || body.quality < 0 || body.quality > 5) {
    return NextResponse.json({ error: 'quality must be 0-5' }, { status: 400 })
  }
  if (!body.eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
  }

  const admin = getAdminClient()
  const result = await awardReviewPoints(admin, user.id, {
    quality: body.quality,
    responseTimeSec: body.responseTimeSec,
  }, body.eventId)

  return NextResponse.json(result)
}
