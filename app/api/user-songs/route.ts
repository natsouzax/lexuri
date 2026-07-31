import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import { isAzureSpeechConfigured } from '@/lib/azure-speech'
import {
  REQUIRED_TAKEAWAYS,
  SONG_SECTION_LAYOUT,
  buildFallbackSong,
  buildSongPrompt,
  validateGeneratedSong,
  type TakeawaySource,
} from '@/lib/music/song'
import type { PersonalSong, PronunciationAttempt } from '@/lib/music/types'
import { errorMessage } from '@/lib/http'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

interface UserSongRow {
  id: string
  title: string
  status: 'ready' | 'practicing' | 'completed'
  locale: string
  bpm: number
  backing_track: string
  source_takeaway_ids: string[]
  final_recording_path: string | null
  final_recording_mime: string | null
  completed_at: string | null
  created_at: string
}

async function studioPayload(supabase: SupabaseClient, userId: string) {
  const [{ data: takeaways, error: takeawaysError }, { data: songRows, error: songsError }] = await Promise.all([
    supabase.from('takeaways').select('id, text, created_at')
      .eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('user_songs').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }),
  ])
  if (takeawaysError) throw takeawaysError
  if (songsError) throw songsError

  const usedIds = new Set(
    ((songRows ?? []) as Array<{ source_takeaway_ids: string[] }>)
      .flatMap((song) => song.source_takeaway_ids ?? []),
  )
  const available = ((takeaways ?? []) as TakeawaySource[]).filter((takeaway) => !usedIds.has(takeaway.id))
  const latest = ((songRows ?? [])[0] ?? null) as UserSongRow | null
  const songHistory = await Promise.all(((songRows ?? []) as UserSongRow[]).map(async (historySong) => {
    let recordingUrl: string | null = null
    if (historySong.final_recording_path) {
      const { data } = await supabase.storage
        .from('song-recordings')
        .createSignedUrl(historySong.final_recording_path, 60 * 60)
      recordingUrl = data?.signedUrl ?? null
    }
    return {
      id: historySong.id,
      title: historySong.title,
      status: historySong.status,
      completed_at: historySong.completed_at,
      recording_url: recordingUrl,
    }
  }))

  let song: PersonalSong | null = null
  let attempts: PronunciationAttempt[] = []
  if (latest) {
    const [{ data: sections, error: sectionsError }, { data: attemptRows, error: attemptsError }] = await Promise.all([
      supabase.from('user_song_sections').select('*')
        .eq('song_id', latest.id).eq('user_id', userId).order('section_order'),
      supabase.from('pronunciation_attempts')
        .select('id, section_id, recognized_text, overall_scores, word_scores, feedback, created_at')
        .eq('song_id', latest.id).eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(70),
    ])
    if (sectionsError) throw sectionsError
    if (attemptsError) throw attemptsError

    song = {
      ...latest,
      sections: sections ?? [],
      recording_url: songHistory[0]?.recording_url ?? null,
    } as PersonalSong
    attempts = (attemptRows ?? []) as PronunciationAttempt[]
  }

  return {
    requiredTakeaways: REQUIRED_TAKEAWAYS,
    totalTakeaways: takeaways?.length ?? 0,
    availableTakeawaysCount: available.length,
    azureConfigured: isAzureSpeechConfigured(),
    song,
    songHistory,
    attempts,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json(await studioPayload(supabase, user.id))
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: takeaways, error: takeawaysError }, { data: existingSongs, error: songsError }] = await Promise.all([
      supabase.from('takeaways').select('id, text, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('user_songs').select('source_takeaway_ids')
        .eq('user_id', user.id),
    ])
    if (takeawaysError) throw takeawaysError
    if (songsError) throw songsError

    const usedIds = new Set(
      ((existingSongs ?? []) as Array<{ source_takeaway_ids: string[] }>)
        .flatMap((song) => song.source_takeaway_ids ?? []),
    )
    const sources = ((takeaways ?? []) as TakeawaySource[])
      .filter((takeaway) => !usedIds.has(takeaway.id))
      .slice(0, REQUIRED_TAKEAWAYS)

    if (sources.length < REQUIRED_TAKEAWAYS) {
      return NextResponse.json({
        error: `You need ${REQUIRED_TAKEAWAYS - sources.length} more chunks before creating a song.`,
      }, { status: 409 })
    }

    const fingerprint = createHash('sha256')
      .update(sources.map((source) => source.id).join('|'))
      .digest('hex')

    const raw = await callLLM(buildSongPrompt(sources))
    const generated = validateGeneratedSong(safeJsonParse(raw)) ?? buildFallbackSong(sources)

    const { data: insertedSong, error: insertError } = await supabase
      .from('user_songs')
      .insert({
        user_id: user.id,
        title: generated.title,
        status: 'ready',
        locale: 'en-US',
        bpm: 88,
        backing_track: 'lexuri-lofi-v1',
        source_takeaway_ids: sources.map((source) => source.id),
        source_fingerprint: fingerprint,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(await studioPayload(supabase, user.id))
      }
      throw insertError
    }

    const sectionRows = generated.sections.map((section, index) => ({
      song_id: insertedSong.id,
      user_id: user.id,
      section_order: index,
      section_type: SONG_SECTION_LAYOUT[index].type,
      label: SONG_SECTION_LAYOUT[index].label,
      lyrics: section.lyrics,
      takeaway_ids: [sources[index * 2].id, sources[index * 2 + 1].id],
    }))
    const { error: sectionsError } = await supabase.from('user_song_sections').insert(sectionRows)
    if (sectionsError) {
      await supabase.from('user_songs').delete().eq('id', insertedSong.id).eq('user_id', user.id)
      throw sectionsError
    }

    return NextResponse.json(await studioPayload(supabase, user.id), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
