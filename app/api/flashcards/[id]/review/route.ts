import { NextResponse } from 'next/server'
import { loadFlashcards, updateFlashcard, getAdminClient } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-server'
import { flashcardToSRSCard, updateCard } from '@/lib/srs'
import { awardReviewPoints } from '@/lib/gamification'
import { errorMessage } from '@/lib/http'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = (await request.json()) as { quality: number; response_time_sec?: number; event_id?: string }

    const cards = await loadFlashcards(user.id)
    const stored = cards.find((c) => c.id === id)
    if (!stored) return NextResponse.json({ error: 'Card not found.' }, { status: 404 })

    const srsCard = flashcardToSRSCard(stored)
    const updated = updateCard(srsCard, body.quality)

    const saved = await updateFlashcard(id, {
      ease_factor:   updated.ease_factor,
      interval:      updated.interval,
      repetitions:   updated.repetitions,
      next_review:   updated.next_review.toISOString(),
      last_reviewed: updated.last_reviewed?.toISOString() ?? null,
    }, user.id)

    // Pontos server-side (idempotente por event_id) — alimenta XP, streak,
    // missões e badges do dashboard.
    const admin = getAdminClient()
    const eventId = body.event_id ?? `review:${id}:${Date.now()}`
    const gamification = await awardReviewPoints(admin, user.id, {
      quality:         body.quality,
      responseTimeSec: body.response_time_sec,
    }, eventId).catch(() => null)

    return NextResponse.json({ ...saved, gamification })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
