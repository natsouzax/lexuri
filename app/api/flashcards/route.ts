import { NextResponse } from 'next/server'
import { loadFlashcards, upsertFlashcards } from '@/lib/supabase'
import type { Flashcard } from '@/lib/types'

export async function GET() {
  try {
    const cards = await loadFlashcards()
    return NextResponse.json(cards)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { cards: Flashcard[] }
    const saved = await upsertFlashcards(body.cards)
    return NextResponse.json(saved)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
