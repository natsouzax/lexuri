import { NextResponse } from 'next/server'
import { loadFlashcards, upsertFlashcards } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-server'
import type { Flashcard } from '@/lib/types'

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cards = await loadFlashcards(userId)
    return NextResponse.json(cards)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { cards: Flashcard[] }
    const saved = await upsertFlashcards(body.cards, userId)
    return NextResponse.json(saved)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
