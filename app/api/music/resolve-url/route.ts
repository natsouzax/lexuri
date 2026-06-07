import { NextResponse } from 'next/server'
import { fetchLyrics } from '@/lib/lyrics'
import { extractSpotifyTrackId, resolveSpotifyTrack } from '@/lib/spotify'
import { extractVideoId, getVideoTitle } from '@/lib/youtube'

interface ResolvedSong {
  title: string
  artist: string
  lrc_content: string | null
  plain_lyrics: string
  youtube_url: string | null
  spotify_url: string | null
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

    const spotifyId = extractSpotifyTrackId(url)
    if (spotifyId) {
      const track = await resolveSpotifyTrack(spotifyId)
      title = track.title
      artist = track.artist
      spotify_url = url
    } else {
      const videoId = extractVideoId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'URL must be a Spotify track or YouTube video.' }, { status: 400 })
      }
      youtube_url = url
      const videoTitle = await getVideoTitle(videoId)
      // YouTube titles are usually "Song Title - Artist" or "Artist - Song Title"
      const parts = videoTitle.split(/\s[-–]\s/)
      if (parts.length >= 2) {
        artist = parts[0].trim()
        title = parts.slice(1).join(' - ').trim()
      } else {
        title = videoTitle
        artist = ''
      }
    }

    const lyrics = await fetchLyrics(artist, title)
    if (!lyrics) {
      return NextResponse.json({
        title,
        artist,
        lrc_content: null,
        plain_lyrics: '',
        youtube_url,
        spotify_url,
        not_found: true,
      } satisfies ResolvedSong & { not_found: boolean })
    }

    return NextResponse.json({
      title: lyrics.title || title,
      artist: lyrics.artist || artist,
      lrc_content: lyrics.lrc_content,
      plain_lyrics: lyrics.plain_lyrics,
      youtube_url,
      spotify_url,
    } satisfies ResolvedSong)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
