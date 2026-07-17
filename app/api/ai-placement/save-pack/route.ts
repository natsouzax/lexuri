import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient, upsertFlashcards } from '@/lib/supabase'
import { PLACEMENT_COMPLETE_XP } from '@/lib/gamification'
import { normalizeFlashcard } from '@/lib/types'
import { createHash } from 'crypto'

interface PackFlashcard {
  front: string
  back: string
  example: string
  level: string
}

interface PackChunk {
  text: string
  type: string
  translation: string
  explanation: string
  example: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { level, flashcards = [], chunks = [] } = await request.json() as {
      level: string
      flashcards: PackFlashcard[]
      chunks: PackChunk[]
    }

    const admin = getAdminClient()

    // Convert pack items to Flashcard[]
    const cards = [
      ...flashcards.map((f) => normalizeFlashcard({
        word: f.front,
        translation: f.back,
        explanation: `(${f.level}) vocabulary`,
        example: f.example,
        source_video: 'placement-quiz',
      })),
      ...chunks.map((c) => normalizeFlashcard({
        word: c.text,
        translation: c.translation,
        explanation: `[${c.type.replace('_', ' ')}] ${c.explanation}`,
        example: c.example,
        source_video: 'placement-quiz',
      })),
    ].filter(Boolean) as NonNullable<ReturnType<typeof normalizeFlashcard>>[]

    if (cards.length > 0) {
      await upsertFlashcards(cards, user.id)
    }

    // Update level in onboarding
    await supabase.from('onboarding').upsert(
      { user_id: user.id, current_level: level },
      { onConflict: 'user_id' },
    )

    // Award placement_complete XP — one-time, stable event_id prevents re-award
    const eventId = createHash('sha256')
      .update(`${user.id}:placement_complete`)
      .digest('hex')
      .slice(0, 16)

    const { error: xpError } = await admin.from('points_history').insert({
      user_id:    user.id,
      event_type: 'placement_complete',
      points:     PLACEMENT_COMPLETE_XP,
      metadata:   { level, cards: cards.length },
      event_id:   eventId,
      event_ts:   new Date().toISOString(),
    })

    if (!xpError) {
      const { data: stats } = await admin
        .from('user_stats')
        .select('points')
        .eq('user_id', user.id)
        .single()
      const prevPoints = (stats?.points as number) ?? 0

      await admin.from('user_stats').upsert(
        { user_id: user.id, points: prevPoints + PLACEMENT_COMPLETE_XP, last_active: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
    }
    // code '23505' = duplicate event_id → XP already awarded, skip silently

    return NextResponse.json({ ok: true, cardsAdded: cards.length, xpAwarded: !xpError })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
