import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import {
  assessSpeechIntelligibility,
  isSpeechAnalysisConfigured,
  SpeechAnalysisServiceError,
} from '@/lib/openai-speech'
import {
  isEquivalentEnglishTranscription,
  nextSpeakingReview,
} from '@/lib/music/speaking-review'
import { validatePcmWav } from '@/lib/music/wav-validation'
import type { SpeakingReviewAssessment, SpeakingReviewItem } from '@/lib/music/types'

interface ReviewRow {
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

function itemPayload(row: ReviewRow): SpeakingReviewItem {
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSpeechAnalysisConfigured()) {
      return NextResponse.json({ error: 'Voice analysis is not configured yet.' }, { status: 503 })
    }

    const { id } = await params
    const { data: item, error: itemError } = await supabase
      .from('speaking_review_items')
      .select('id, word, source_song_id, last_heard_as, ease_factor, interval_days, repetitions, attempt_count, success_count, last_score, next_review_at, last_reviewed_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (itemError) throw itemError
    if (!item) return NextResponse.json({ error: 'Speaking-review word not found.' }, { status: 404 })

    const form = await request.formData()
    const file = form.get('audio')
    const nativeLanguage = String(form.get('nativeLanguage') ?? '')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing pronunciation recording.' }, { status: 400 })
    }
    const audio = await file.arrayBuffer()
    validatePcmWav(audio, {
      recordingName: 'word recording',
      maxBytes: 512 * 1024,
      minSeconds: 0.25,
      maxSeconds: 8,
    })

    // The target is used only after transcription for alignment. The recognizer
    // receives generic English-only context, never this word as the answer.
    const result = await assessSpeechIntelligibility(audio, String(item.word), 'en-US', {
      filename: 'speaking-review.wav',
      mimeType: 'audio/wav',
      timeoutMs: 35_000,
      nativeLanguage,
    })
    const understood = (
      result.words.length > 0
      && result.words.every((word) => word.errorType === 'None')
    ) || isEquivalentEnglishTranscription(String(item.word), result.recognizedText)
    const clarityScore = result.scores.pronunciation ?? result.scores.accuracy
    const reviewedAt = new Date()
    const schedule = nextSpeakingReview({
      easeFactor: Number(item.ease_factor),
      intervalDays: Number(item.interval_days),
      repetitions: Number(item.repetitions),
    }, understood, clarityScore, reviewedAt)

    const { data: updated, error: updateError } = await supabase
      .from('speaking_review_items')
      .update({
        last_heard_as: result.recognizedText || null,
        ease_factor: schedule.easeFactor,
        interval_days: schedule.intervalDays,
        repetitions: schedule.repetitions,
        attempt_count: Number(item.attempt_count) + 1,
        success_count: Number(item.success_count) + (understood ? 1 : 0),
        last_score: clarityScore,
        next_review_at: schedule.nextReviewAt.toISOString(),
        last_reviewed_at: reviewedAt.toISOString(),
        updated_at: reviewedAt.toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, word, source_song_id, last_heard_as, ease_factor, interval_days, repetitions, attempt_count, success_count, last_score, next_review_at, last_reviewed_at')
      .single()
    if (updateError) throw updateError

    const { error: attemptError } = await supabase.from('speaking_review_attempts').insert({
      item_id: id,
      user_id: user.id,
      reference_word: item.word,
      recognized_text: result.recognizedText,
      understood,
      scores: result.scores,
    })
    if (attemptError) throw attemptError

    const assessment: SpeakingReviewAssessment = {
      ...result,
      understood,
      feedback: understood
        ? `Understood as “${result.recognizedText}”. This word is scheduled for another day.`
        : result.recognizedText
          ? `The AI heard “${result.recognizedText}”. Listen once, then say “${item.word}” again.`
          : `The AI did not hear “${item.word}”. Move closer to the microphone and try again.`,
      item: itemPayload(updated as ReviewRow),
    }

    return NextResponse.json(assessment)
  } catch (error) {
    const status = error instanceof SpeechAnalysisServiceError ? 502 : 400
    return NextResponse.json({ error: errorMessage(error) }, { status })
  }
}
