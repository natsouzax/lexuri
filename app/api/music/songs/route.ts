import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPremiumStatus, getWeeklyUsage, incrementWeeklyUsage, FREE_LIMITS } from '@/lib/subscription'
import type { Song } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data as Song[])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ isPremium }, usage] = await Promise.all([
      getUserPremiumStatus(user.id),
      getWeeklyUsage(user.id),
    ])

    if (!isPremium && usage.musicImports >= FREE_LIMITS.weeklyMusicImports) {
      return NextResponse.json(
        {
          error: `Free plan limit reached. You can import ${FREE_LIMITS.weeklyMusicImports} songs per week. Upgrade to Premium for unlimited access.`,
          limitReached: true,
          upgradeUrl: '/plans',
        },
        { status: 403 },
      )
    }

    const body = (await request.json()) as {
      title: string
      artist: string
      plain_lyrics: string
      lrc_content?: string | null
      spotify_url?: string | null
      youtube_url?: string | null
    }

    if (!body.title?.trim() || !body.artist?.trim()) {
      return NextResponse.json({ error: 'title and artist are required.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('songs')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        artist: body.artist.trim(),
        plain_lyrics: body.plain_lyrics ?? '',
        lrc_content: body.lrc_content ?? null,
        spotify_url: body.spotify_url ?? null,
        youtube_url: body.youtube_url ?? null,
      })
      .select()
      .single()

    if (error) throw error

    if (!isPremium) {
      await incrementWeeklyUsage(user.id, 'music_imports')
    }

    return NextResponse.json(data as Song, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
