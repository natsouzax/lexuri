import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchLyrics } from '@/lib/lyrics'
import { getUserAccessToken, getSpotifyLyrics, searchSpotifyTrackId } from '@/lib/spotify'
import { mergeLyricsSources } from '@/lib/lyrics-merge'
import type { LyricsSourceInput } from '@/lib/lyrics-merge'

interface RequestBody {
  artist: string
  title: string
  spotify_track_id?: string
  // YouTube segments if available (from a prior fetch)
  youtube_segments?: Array<{ text: string; start: number; duration: number }>
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = (await request.json()) as RequestBody
    const { artist, title, spotify_track_id, youtube_segments } = body

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

    // ── Sources 3-5: text-only fallbacks (lrclib, genius, happi) ──────────
    const textResult = await fetchLyrics(artist, title)
    if (textResult) {
      if (textResult.lrc_content) {
        sources.push({ name: 'lrclib', lrc: textResult.lrc_content, plain_text: textResult.plain_lyrics })
      } else {
        // Genius or Happi plain text
        sources.push({ name: 'genius', plain_text: textResult.plain_lyrics })
      }
    }

    if (!sources.length) {
      return NextResponse.json({ error: 'No lyrics found from any source' }, { status: 404 })
    }

    const merged = await mergeLyricsSources(sources)

    return NextResponse.json({
      ...merged,
      title: textResult?.title ?? title,
      artist: textResult?.artist ?? artist,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
