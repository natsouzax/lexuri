import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchFromLrcLib, fetchLyricsFromGeniusPublic, fetchFromLyricsOvh } from '@/lib/lyrics'
import { getUserAccessToken, getSpotifyLyrics, searchSpotifyTrackId } from '@/lib/spotify'
import { mergeLyricsSources } from '@/lib/lyrics-merge'
import { searchYouTubeVideo } from '@/lib/youtube'
import type { LyricsSourceInput } from '@/lib/lyrics-merge'

interface RequestBody {
  artist: string
  title: string
  spotify_track_id?: string
  youtube_segments?: Array<{ text: string; start: number; duration: number }>
  existing_youtube_url?: string | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = (await request.json()) as RequestBody
    const { artist, title, spotify_track_id, youtube_segments, existing_youtube_url } = body

    if (!artist || !title) {
      return NextResponse.json({ error: 'artist and title are required' }, { status: 400 })
    }

    const sources: LyricsSourceInput[] = []

    // ── Source 1: YouTube segments (if ♪ detected, merge will fast-path) ──
    if (youtube_segments?.length) {
      sources.push({ name: 'youtube', segments: youtube_segments })
    }

    // ── Source 2: Spotify line-synced lyrics (requires user OAuth) ────────
    if (user) {
      const userToken = await getUserAccessToken(user.id)
      if (userToken) {
        const trackId =
          spotify_track_id ?? (await searchSpotifyTrackId(artist, title, userToken))
        if (trackId) {
          const spotifyLines = await getSpotifyLyrics(trackId, userToken)
          if (spotifyLines) {
            sources.push({ name: 'spotify', spotify_lines: spotifyLines })
          }
        }
      }
    }

    // ── Sources 3-5: text fallbacks (parallel) + YouTube video search ─────
    const [lrcResult, geniusText, ovhText, discoveredYoutubeUrl] = await Promise.allSettled([
      fetchFromLrcLib(artist, title),
      fetchLyricsFromGeniusPublic(artist, title),
      fetchFromLyricsOvh(artist, title),
      // Skip YouTube search if the song already has a video URL
      existing_youtube_url ? Promise.resolve(null) : searchYouTubeVideo(artist, title),
    ])

    const lrc = lrcResult.status === 'fulfilled' ? lrcResult.value : null
    const genius = geniusText.status === 'fulfilled' ? geniusText.value : null
    const ovh = ovhText.status === 'fulfilled' ? ovhText.value : null
    const youtubeUrl = discoveredYoutubeUrl.status === 'fulfilled' ? discoveredYoutubeUrl.value : null

    if (lrc?.lrc_content) {
      sources.push({ name: 'lrclib', lrc: lrc.lrc_content, plain_text: lrc.plain_lyrics })
    } else if (lrc?.plain_lyrics) {
      sources.push({ name: 'lrclib', plain_text: lrc.plain_lyrics })
    }
    if (genius) sources.push({ name: 'genius', plain_text: genius })
    if (ovh) sources.push({ name: 'lyricsovh', plain_text: ovh })

    if (!sources.length) {
      return NextResponse.json({ error: 'No lyrics found from any source' }, { status: 404 })
    }

    const merged = await mergeLyricsSources(sources)

    return NextResponse.json({
      ...merged,
      title: lrc?.title ?? title,
      artist: lrc?.artist ?? artist,
      youtube_url: existing_youtube_url ?? youtubeUrl,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
