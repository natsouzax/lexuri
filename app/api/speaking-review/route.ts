import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import { isSpeechAnalysisConfigured } from '@/lib/openai-speech'
import { normalizeSpeakingTarget } from '@/lib/music/speaking-review'
import type {
  PronunciationWord,
  SpeakingReviewData,
  SpeakingReviewItem,
} from '@/lib/music/types'

interface SpeakingReviewRow {
  id: string
  word: string
  source_song_id: string | null
  last_heard_as: string | null
  ease_factor: number | string
  interval_days: number
  repetitions: number
  attempt_count: number
  success_count: number
  last_score: number | string | null
  next_review_at: string
  last_reviewed_at: string | null
}

function itemPayload(row: SpeakingReviewRow): SpeakingReviewItem {
  return {
    id: row.id,
    word: row.word,
    sourceSongId: row.source_song_id,
    lastHeardAs: row.last_heard_as,
    easeFactor: Number(row.ease_factor),
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    attemptCount: row.attempt_count,
    successCount: row.success_count,
    lastScore: row.last_score === null ? null : Number(row.last_score),
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
  }
}

async function loadSpeakingReview(userId: string): Promise<SpeakingReviewData> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('speaking_review_items')
    .select('id, word, source_song_id, last_heard_as, ease_factor, interval_days, repetitions, attempt_count, success_count, last_score, next_review_at, last_reviewed_at')
    .eq('user_id', userId)
    .order('next_review_at', { ascending: true })
  if (error) throw error

  const now = Date.now()
  const allItems = ((data ?? []) as SpeakingReviewRow[]).map(itemPayload)
  const items = allItems.filter((item) => new Date(item.nextReviewAt).getTime() <= now)
  return {
    items,
    stats: {
      total: allItems.length,
      due: items.length,
      learning: allItems.filter((item) => item.repetitions > 0 && item.repetitions < 3).length,
      mastered: allItems.filter((item) => item.repetitions >= 3).length,
    },
    speechAnalysisConfigured: isSpeechAnalysisConfigured(),
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(await loadSpeakingReview(user.id))
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { songId?: string }
    const songId = body.songId?.trim() ?? ''
    if (!songId) return NextResponse.json({ error: 'Missing song.' }, { status: 400 })

    const { data: song, error: songError } = await supabase
      .from('user_songs')
      .select('id, performance_word_scores')
      .eq('id', songId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (songError) throw songError
    if (!song) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })

    const focusWords = ((song.performance_word_scores ?? []) as PronunciationWord[])
      .filter((word) => word.errorType !== 'None')
    const uniqueTargets = new Map<string, PronunciationWord>()
    for (const word of focusWords) {
      const normalized = normalizeSpeakingTarget(word.word)
      if (normalized && !uniqueTargets.has(normalized)) uniqueTargets.set(normalized, word)
    }
    if (uniqueTargets.size === 0) {
      return NextResponse.json({ error: 'This performance has no words to practise.' }, { status: 409 })
    }

    const normalizedWords = [...uniqueTargets.keys()]
    const { data: existingRows, error: existingError } = await supabase
      .from('speaking_review_items')
      .select('id, normalized_word')
      .eq('user_id', user.id)
      .in('normalized_word', normalizedWords)
    if (existingError) throw existingError

    const existingByWord = new Map(
      (existingRows ?? []).map((row) => [String(row.normalized_word), String(row.id)]),
    )
    const now = new Date().toISOString()
    const inserts = normalizedWords.flatMap((normalized) => {
      if (existingByWord.has(normalized)) return []
      const target = uniqueTargets.get(normalized)!
      return [{
        user_id: user.id,
        source_song_id: songId,
        word: target.word.trim(),
        normalized_word: normalized,
        last_heard_as: target.recognizedWord?.trim() || null,
        next_review_at: now,
      }]
    })

    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from('speaking_review_items').insert(inserts)
      if (insertError) throw insertError
    }

    const updateResults = await Promise.all(normalizedWords.flatMap((normalized) => {
      const id = existingByWord.get(normalized)
      if (!id) return []
      const target = uniqueTargets.get(normalized)!
      return [supabase.from('speaking_review_items').update({
        source_song_id: songId,
        word: target.word.trim(),
        last_heard_as: target.recognizedWord?.trim() || null,
        next_review_at: now,
        updated_at: now,
      }).eq('id', id).eq('user_id', user.id)]
    }))
    const updateError = updateResults.find((result) => result.error)?.error
    if (updateError) throw updateError

    return NextResponse.json({
      savedCount: uniqueTargets.size,
      createdCount: inserts.length,
      review: await loadSpeakingReview(user.id),
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
