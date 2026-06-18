import { NextResponse } from 'next/server'
import { getMusicLyrics } from '@/lib/lyrics-music'
import { extractSpotifyTrackId, resolveSpotifyTrack } from '@/lib/spotify'
import { extractVideoId, getVideoTitle } from '@/lib/youtube'

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
    const body = (await request.json()) as { url: string }
    const { url } = body
    if (!url?.trim()) {
      return NextResponse.json({ error: 'url is required.' }, { status: 400 })
    }

    let title = ''
    let artist = ''
    let youtube_url: string | null = null
    let spotify_url: string | null = null
    let youtubeVideoId: string | null = null
    let spotifyTrackId: string | null = null

    const spotifyId = extractSpotifyTrackId(url)
    if (spotifyId) {
      const track = await resolveSpotifyTrack(spotifyId)
      title = track.title
      artist = track.artist
      spotify_url = url
      spotifyTrackId = spotifyId
    } else {
      const videoId = extractVideoId(url)
      if (!videoId) {
        return NextResponse.json(
          { error: 'URL must be a Spotify track or YouTube video.' },
          { status: 400 },
        )
      }
      youtube_url = url
      youtubeVideoId = videoId
      const videoTitle = await getVideoTitle(videoId)
      const parts = videoTitle.split(/\s[-–]\s/)
      if (parts.length >= 2) {
        artist = parts[0].trim()
        title  = parts.slice(1).join(' - ').trim()
      } else {
        title  = videoTitle
        artist = ''
      }
    }

    const result = await getMusicLyrics(artist, title, {
      youtubeVideoId,
      spotifyTrackId,
      userId: null, // user id not available at route level without auth — Spotify lyrics via merge route
    })

    return NextResponse.json({
      title:        result.title  || title,
      artist:       result.artist || artist,
      lrc_content:  result.lrc_content,
      plain_lyrics: result.plain_lyrics,
      youtube_url,
      spotify_url,
      verified:     result.verified,
      lyrics_source: result.source,
    } satisfies ResolvedSong)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
