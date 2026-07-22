import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import { getAlbum, sungTracks } from '@/lib/album'
import { nextReviewStep, type SongProgress } from '@/lib/mvp'

// GET: progresso do álbum — estado de cada faixa + progresso do ciclo global.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const album = getAlbum(id)
    if (!album) return NextResponse.json({ error: 'Album not found.' }, { status: 404 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const songIds = sungTracks(album).map((t) => t.songId)

    const [{ data: songRows }, { data: albumRow }] = await Promise.all([
      supabase.from('song_progress').select('*').eq('user_id', user.id).in('song_id', songIds),
      supabase.from('album_progress').select('*').eq('user_id', user.id).eq('album_id', id).maybeSingle(),
    ])

    const progress = (songRows ?? []) as SongProgress[]
    const doneSongIds = progress.filter((p) => nextReviewStep(p) === 'done').map((p) => p.song_id)

    return NextResponse.json({
      songProgress: progress,
      doneSongIds,
      albumProgress: albumRow ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}

// POST { action: 'day1' | 'day2' | 'day3' } — marca um dia do ciclo global.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!getAlbum(id)) return NextResponse.json({ error: 'Album not found.' }, { status: 404 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action } = (await request.json()) as { action: 'day1' | 'day2' | 'day3' }
    if (!['day1', 'day2', 'day3'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    const patch: Record<string, string> = { user_id: user.id, album_id: id }
    patch[`album_${action}_done_at`] = new Date().toISOString()

    const { data, error } = await supabase
      .from('album_progress')
      .upsert(patch, { onConflict: 'user_id,album_id' })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
