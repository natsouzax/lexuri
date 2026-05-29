import { NextResponse } from 'next/server'
import { loadFlashcards, updateFlashcard } from '@/lib/supabase'
import { flashcardToSRSCard, updateCard } from '@/lib/srs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as { quality: number }
    const cards = await loadFlashcards()
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
    })

    return NextResponse.json(saved)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
