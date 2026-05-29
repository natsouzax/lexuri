import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q) return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 })

    const apiKey = process.env.GENIUS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GENIUS_API_KEY is not configured.' }, { status: 500 })

    const res = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    )

    if (!res.ok) {
      return NextResponse.json({ error: `Genius API returned ${res.status}` }, { status: 502 })
    }

    const data = (await res.json()) as {
      response?: { hits?: Array<{ result?: { title?: string; primary_artist?: { name?: string }; url?: string } }> }
    }

    const hits = data.response?.hits ?? []
    if (!hits.length) return NextResponse.json({ error: 'No results found.' }, { status: 404 })

    const first = hits[0].result
    return NextResponse.json({
      title: first?.title ?? '',
      artist: first?.primary_artist?.name ?? '',
      genius_url: first?.url ?? '',
      lyrics: 'Lyrics extraction is not implemented yet. Please visit the Genius page linked above.',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
