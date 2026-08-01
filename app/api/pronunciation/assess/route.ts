import { NextResponse } from 'next/server'
import {
  assessSpeechIntelligibility,
  isSpeechAnalysisConfigured,
  SpeechAnalysisServiceError,
} from '@/lib/openai-speech'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import { validatePcmWav } from '@/lib/music/wav-validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSpeechAnalysisConfigured()) {
      return NextResponse.json({
        error: 'Voice analysis is not configured yet.',
        code: 'SPEECH_ANALYSIS_NOT_CONFIGURED',
      }, { status: 503 })
    }

    const form = await request.formData()
    const file = form.get('audio')
    const songId = String(form.get('songId') ?? '')
    const sectionId = String(form.get('sectionId') ?? '')
    const nativeLanguage = String(form.get('nativeLanguage') ?? '')
    if (!(file instanceof File) || !songId || !sectionId) {
      return NextResponse.json({ error: 'Missing recording, song, or section.' }, { status: 400 })
    }

    const { data: section, error: sectionError } = await supabase
      .from('user_song_sections')
      .select('id, song_id, lyrics, best_pronunciation_score')
      .eq('id', sectionId)
      .eq('song_id', songId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (sectionError) throw sectionError
    if (!section) return NextResponse.json({ error: 'Song section not found.' }, { status: 404 })

    const audio = await file.arrayBuffer()
    validatePcmWav(audio, { recordingName: 'pronunciation recording' })
    const referenceText = String(section.lyrics).replace(/\s+/g, ' ').trim()
    const result = await assessSpeechIntelligibility(audio, referenceText, 'en-US', {
      nativeLanguage,
    })

    const { data: attempt, error: attemptError } = await supabase
      .from('pronunciation_attempts')
      .insert({
        user_id: user.id,
        song_id: songId,
        section_id: sectionId,
        reference_text: referenceText,
        recognized_text: result.recognizedText,
        overall_scores: result.scores,
        word_scores: result.words,
        feedback: result.feedback,
      })
      .select('id, created_at')
      .single()
    if (attemptError) throw attemptError

    const score = result.scores.pronunciation ?? result.scores.accuracy
    const previous = section.best_pronunciation_score === null
      ? null
      : Number(section.best_pronunciation_score)
    const sectionUpdate: Record<string, string | number> = {
      last_practiced_at: new Date().toISOString(),
    }
    if (score !== null && (previous === null || score > previous)) {
      sectionUpdate.best_pronunciation_score = score
    }

    await Promise.all([
      supabase.from('user_song_sections').update(sectionUpdate)
        .eq('id', sectionId).eq('user_id', user.id),
      supabase.from('user_songs').update({ status: 'practicing', updated_at: new Date().toISOString() })
        .eq('id', songId).eq('user_id', user.id).neq('status', 'completed'),
    ])

    return NextResponse.json({ ...result, attemptId: attempt.id, createdAt: attempt.created_at })
  } catch (error) {
    const message = errorMessage(error)
    const status = error instanceof SpeechAnalysisServiceError ? 502 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
