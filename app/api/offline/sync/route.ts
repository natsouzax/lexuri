import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { loadFlashcards, updateFlashcard } from '@/lib/supabase'
import { flashcardToSRSCard, updateCard } from '@/lib/srs'
import { getAdminClient } from '@/lib/supabase'
import { awardReviewPoints } from '@/lib/gamification'

interface SyncBody {
  clientId:        string   // UUID generated client-side (idempotency key)
  cardId:          string
  quality:         number
  responseTimeSec?: number
  reviewedAt:      string   // ISO timestamp
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: SyncBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.clientId || !body.cardId || typeof body.quality !== 'number') {
    return NextResponse.json({ error: 'clientId, cardId, quality are required' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Idempotency: check if this clientId was already applied
  const { data: existing } = await admin
    .from('points_history')
    .select('id')
    .eq('event_id', `offline:${body.clientId}`)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const cards = await loadFlashcards(user.id)
  const stored = cards.find(c => c.id === body.cardId)
  if (!stored) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const srsCard = flashcardToSRSCard(stored)
  const updated = updateCard(srsCard, body.quality)

  await updateFlashcard(body.cardId, {
    ease_factor:   updated.ease_factor,
    interval:      updated.interval,
    repetitions:   updated.repetitions,
    next_review:   updated.next_review.toISOString(),
    last_reviewed: updated.last_reviewed?.toISOString() ?? null,
  }, user.id)

  await awardReviewPoints(admin, user.id, {
    quality:         body.quality,
    responseTimeSec: body.responseTimeSec,
  }, `offline:${body.clientId}`)

  return NextResponse.json({ ok: true, duplicate: false })
}
