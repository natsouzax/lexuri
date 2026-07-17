import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  fetchFromLrcLib,
  fetchLyricsFromGenius,
  fetchFromLyricsOvh,
  fetchSpotifyTimedLines,
  mergeLyricsSources,
  type LyricsSourceInput,
} from '@/lib/media/lyrics'
import { getUserAccessToken, searchSpotifyTrackId, trackUrl } from '@/lib/media/spotify'
import { searchYouTubeVideo } from '@/lib/media/youtube'

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
    // Track resolution happens here regardless of whether timed lyrics come
    // back — the caller needs the track id to play the audio even when the
    // lyrics sync itself falls back to another source.
    let resolvedTrackId = spotify_track_id ?? null
    if (user) {
      const userToken = await getUserAccessToken(user.id)
      if (userToken) {
        resolvedTrackId ??= await searchSpotifyTrackId(artist, title, userToken)
        if (resolvedTrackId) {
          const timedLines = await fetchSpotifyTimedLines(resolvedTrackId, userToken)
          if (timedLines) {
            sources.push({ name: 'spotify', timedLines })
          }
        }
      }
    }

    // ── Sources 3-5: text fallbacks (parallel) + YouTube video search ─────
    const [lrcResult, geniusText, ovhText, discoveredYoutubeUrl] = await Promise.allSettled([
      fetchFromLrcLib(artist, title),
      fetchLyricsFromGenius(artist, title),
      fetchFromLyricsOvh(artist, title),
      // Skip YouTube search if the song already has a video URL
      existing_youtube_url ? Promise.resolve(null) : searchYouTubeVideo(artist, title),
    ])

    const lrc = lrcResult.status === 'fulfilled' ? lrcResult.value : null
    const genius = geniusText.status === 'fulfilled' ? geniusText.value : null
    const ovh = ovhText.status === 'fulfilled' ? ovhText.value : null
    const youtubeUrl = discoveredYoutubeUrl.status === 'fulfilled' ? discoveredYoutubeUrl.value : null

    if (lrc?.syncedLrc) {
      sources.push({ name: 'lrclib', lrc: lrc.syncedLrc, plainText: lrc.plainLyrics })
    } else if (lrc?.plainLyrics) {
      sources.push({ name: 'lrclib', plainText: lrc.plainLyrics })
    }
    if (genius) sources.push({ name: 'genius', plainText: genius })
    if (ovh) sources.push({ name: 'lyricsovh', plainText: ovh })

    if (!sources.length) {
      return NextResponse.json({ error: 'No lyrics found from any source' }, { status: 404 })
    }

    const merged = await mergeLyricsSources(sources)

    return NextResponse.json({
      ...merged,
      title: lrc?.title ?? title,
      artist: lrc?.artist ?? artist,
      youtube_url: existing_youtube_url ?? youtubeUrl,
      spotify_track_id: resolvedTrackId,
      spotify_url: resolvedTrackId ? trackUrl(resolvedTrackId) : null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
