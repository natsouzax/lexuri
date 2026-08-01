import { NextResponse } from 'next/server'
import {
  assessSpeechIntelligibility,
  isSpeechAnalysisConfigured,
  SpeechAnalysisServiceError,
} from '@/lib/openai-speech'
import { countSpeechWords } from '@/lib/music/intelligibility'
import type {
  PersonalSongSection,
  SongPerformanceAssessment,
  SongPerformanceSectionResult,
} from '@/lib/music/types'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'video/webm',
])

function extensionForAudioType(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('wav')) return 'wav'
  return 'webm'
}

function sectionResults(
  sections: PersonalSongSection[],
  words: SongPerformanceAssessment['words'],
): SongPerformanceSectionResult[] {
  let offset = 0
  return sections.map((section) => {
    const totalWords = countSpeechWords(section.lyrics)
    const sectionWords = words.slice(offset, offset + totalWords)
    offset += totalWords
    const understoodCount = sectionWords.filter((word) => word.errorType === 'None').length
    return {
      sectionId: section.id,
      label: section.label,
      score: totalWords === 0 ? 0 : Math.round(understoodCount / totalWords * 10_000) / 100,
      understoodCount,
      totalWords,
    }
  })
}

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
    const nativeLanguage = String(form.get('nativeLanguage') ?? '')
    if (!(file instanceof File) || !songId) {
      return NextResponse.json({ error: 'Missing performance recording or song.' }, { status: 400 })
    }
    const mimeType = file.type.split(';')[0].toLowerCase()
    if (!ALLOWED_AUDIO_TYPES.has(mimeType) || file.size < 1_000 || file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({
        error: 'The performance must be a supported audio file smaller than 25 MB.',
      }, { status: 400 })
    }

    const [{ data: song, error: songError }, { data: sectionRows, error: sectionsError }] = await Promise.all([
      supabase.from('user_songs').select('id, locale')
        .eq('id', songId).eq('user_id', user.id).maybeSingle(),
      supabase.from('user_song_sections').select('*')
        .eq('song_id', songId).eq('user_id', user.id).order('section_order'),
    ])
    if (songError) throw songError
    if (sectionsError) throw sectionsError
    if (!song) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })
    const sections = (sectionRows ?? []) as PersonalSongSection[]
    if (sections.length === 0) {
      return NextResponse.json({ error: 'This song has no lyrics to assess.' }, { status: 400 })
    }

    const referenceText = sections.map((section) => section.lyrics.replace(/\s+/g, ' ').trim()).join(' ')
    const result = await assessSpeechIntelligibility(
      await file.arrayBuffer(),
      referenceText,
      String(song.locale ?? 'en-US'),
      {
        filename: `final-voice.${extensionForAudioType(mimeType)}`,
        mimeType,
        timeoutMs: 75_000,
        scope: 'song',
        nativeLanguage,
      },
    )
    const assessedAt = new Date().toISOString()
    const assessment: SongPerformanceAssessment = {
      ...result,
      sections: sectionResults(sections, result.words),
      assessedAt,
    }

    const { error: updateError } = await supabase.from('user_songs').update({
      performance_recognized_text: assessment.recognizedText,
      performance_overall_scores: assessment.scores,
      performance_word_scores: assessment.words,
      performance_section_results: assessment.sections,
      performance_feedback: assessment.feedback,
      performance_assessed_at: assessedAt,
      updated_at: assessedAt,
    }).eq('id', songId).eq('user_id', user.id)
    if (updateError) throw updateError

    return NextResponse.json(assessment)
  } catch (error) {
    const message = errorMessage(error)
    const status = error instanceof SpeechAnalysisServiceError ? 502 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
