import { NextResponse } from 'next/server'
import { searchGenius, fetchLyricsFromGeniusUrl } from '@/lib/media/lyrics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q) return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 })

    if (!process.env.GENIUS_API_KEY) {
      return NextResponse.json({ error: 'GENIUS_API_KEY is not configured.' }, { status: 500 })
    }

    const hit = await searchGenius(q)
    if (!hit) return NextResponse.json({ error: 'No results found.' }, { status: 404 })

    const lyrics = await fetchLyricsFromGeniusUrl(hit.url)

    return NextResponse.json({
      title: hit.title,
      artist: hit.artist,
      genius_url: hit.url,
      lyrics: lyrics ?? 'Lyrics could not be extracted. Please visit the Genius page linked above.',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
