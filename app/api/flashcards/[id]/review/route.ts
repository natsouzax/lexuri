import { NextResponse } from 'next/server'
import { loadFlashcards, updateFlashcard } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-server'
import { flashcardToSRSCard, updateCard } from '@/lib/srs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = (await request.json()) as { quality: number }
    const cards = await loadFlashcards(user.id)
    const stored = cards.find((c) => c.id === id)
    if (!stored) return NextResponse.json({ error: 'Card not found.' }, { status: 404 })

    const srsCard = flashcardToSRSCard(stored)
    const updated = updateCard(srsCard, body.quality)

    const saved = await updateFlashcard(id, {
      ease_factor: updated.ease_factor,
      interval: updated.interval,
      repetitions: updated.repetitions,
      next_review: updated.next_review.toISOString(),
      last_reviewed: updated.last_reviewed?.toISOString() ?? null,
    }, user.id)

    return NextResponse.json(saved)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
