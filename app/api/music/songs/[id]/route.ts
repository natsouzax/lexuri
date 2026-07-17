import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Song } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })
    return NextResponse.json(data as Song)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as {
      chunks_count?: number
      spotify_url?: string | null
      youtube_url?: string | null
      lrc_content?: string | null
    }

    const update: Record<string, unknown> = {}
    if ('chunks_count' in body) update.chunks_count = body.chunks_count ?? 0
    if ('spotify_url' in body) update.spotify_url = body.spotify_url
    if ('youtube_url' in body) update.youtube_url = body.youtube_url
    if ('lrc_content' in body) update.lrc_content = body.lrc_content

    const { data, error } = await supabase
      .from('songs')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })
    return NextResponse.json(data as Song)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
