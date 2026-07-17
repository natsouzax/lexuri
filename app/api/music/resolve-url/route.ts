import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { detectMediaUrl, getMusicLyricsService } from '@/lib/media'
import { resolveSpotifyTrack, fetchSpotifyTrackTitleViaOEmbed, getUserAccessToken } from '@/lib/media/spotify'
import { getVideoTitle } from '@/lib/media/youtube'

interface ResolvedSong {
  title: string
  artist: string
  lrc_content: string | null
  plain_lyrics: string
  youtube_url: string | null
  spotify_url: string | null
  verified: boolean
  lyrics_source: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = (await request.json()) as { url: string }
    const { url } = body
    if (!url?.trim()) {
      return NextResponse.json({ error: 'url is required.' }, { status: 400 })
    }

    // The Router identifies the platform from the URL; each platform module
    // then resolves the track metadata for its own resource type.
    const media = detectMediaUrl(url)

    let title = ''
    let artist = ''
    let youtube_url: string | null = null
    let spotify_url: string | null = null
    let youtubeVideoId: string | null = null
    let spotifyTrackId: string | null = null

    if (media?.platform === 'spotify' && media.resource.kind === 'track') {
      // Prefer the connected user's own OAuth token — Spotify's client-credentials
      // flow requires the *app owner* to have an active Premium subscription for
      // catalog access, so it can 403 independently of anything the user did.
      const userToken = user ? await getUserAccessToken(user.id) : null
      try {
        const track = await resolveSpotifyTrack(media.resource.id, userToken ?? undefined)
        title = track.title
        artist = track.artist
      } catch (e) {
        // Last resort: Spotify's public oEmbed needs no token but only returns
        // a title (no artist) — still lets the user proceed instead of a hard 403.
        const oembedTitle = await fetchSpotifyTrackTitleViaOEmbed(url)
        if (!oembedTitle) throw e
        title = oembedTitle
      }
      spotify_url = url
      spotifyTrackId = media.resource.id
    } else if (media?.platform === 'youtube' && media.resource.kind === 'video') {
      youtube_url = url
      youtubeVideoId = media.resource.id
      const videoTitle = await getVideoTitle(media.resource.id)
      const parts = videoTitle.split(/\s[-–]\s/)
      if (parts.length >= 2) {
        artist = parts[0].trim()
        title  = parts.slice(1).join(' - ').trim()
      } else {
        title  = videoTitle
        artist = ''
      }
    } else {
      return NextResponse.json(
        { error: 'URL must be a Spotify track or YouTube video.' },
        { status: 400 },
      )
    }

    const result = await getMusicLyricsService().getLyrics({
      artist,
      title,
      youtubeVideoId,
      spotifyTrackId,
      userId: user?.id ?? null,
    })

    return NextResponse.json({
      title:        result.title  || title,
      artist:       result.artist || artist,
      lrc_content:  result.syncedLrc,
      plain_lyrics: result.plainLyrics,
      youtube_url,
      spotify_url,
      verified:     result.verified,
      lyrics_source: result.source,
    } satisfies ResolvedSong)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
