import { NextResponse } from 'next/server'
import { assessPronunciation, isAzureSpeechConfigured } from '@/lib/azure-speech'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

const MAX_AUDIO_BYTES = 2 * 1024 * 1024

function ascii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('')
}

function validatePcmWav(audio: ArrayBuffer): number {
  if (audio.byteLength < 44 || audio.byteLength > MAX_AUDIO_BYTES) {
    throw new Error('The recording must be a WAV file smaller than 2 MB.')
  }

  const view = new DataView(audio)
  if (ascii(view, 0, 4) !== 'RIFF' || ascii(view, 8, 4) !== 'WAVE') {
    throw new Error('Invalid WAV recording.')
  }

  let offset = 12
  let sampleRate = 0
  let channels = 0
  let bitsPerSample = 0
  let audioFormat = 0
  let dataSize = 0

  while (offset + 8 <= view.byteLength) {
    const chunkId = ascii(view, offset, 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkData = offset + 8
    if (chunkData + chunkSize > view.byteLength) break

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      audioFormat = view.getUint16(chunkData, true)
      channels = view.getUint16(chunkData + 2, true)
      sampleRate = view.getUint32(chunkData + 4, true)
      bitsPerSample = view.getUint16(chunkData + 14, true)
    }
    if (chunkId === 'data') dataSize = chunkSize
    offset = chunkData + chunkSize + (chunkSize % 2)
  }

  if (audioFormat !== 1 || channels !== 1 || sampleRate !== 16_000 || bitsPerSample !== 16 || dataSize === 0) {
    throw new Error('Azure requires mono PCM WAV audio at 16 kHz and 16-bit.')
  }

  const duration = dataSize / (sampleRate * channels * (bitsPerSample / 8))
  if (duration < 0.35) throw new Error('The recording is too short. Say the complete section.')
  if (duration > 30) throw new Error('Each pronunciation recording must be 30 seconds or shorter.')
  return duration
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAzureSpeechConfigured()) {
      return NextResponse.json({
        error: 'Azure Speech is not configured yet.',
        code: 'AZURE_NOT_CONFIGURED',
      }, { status: 503 })
    }

    const form = await request.formData()
    const file = form.get('audio')
    const songId = String(form.get('songId') ?? '')
    const sectionId = String(form.get('sectionId') ?? '')
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
    validatePcmWav(audio)
    const referenceText = String(section.lyrics).replace(/\s+/g, ' ').trim()
    const result = await assessPronunciation(audio, referenceText, 'en-US')

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
    const status = message.includes('Azure Speech error') ? 502 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

