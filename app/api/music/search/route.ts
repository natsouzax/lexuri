import { NextResponse } from 'next/server'
import { searchTrackCandidates } from '@/lib/media/track-search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q?.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 })
    }

    const candidates = await searchTrackCandidates(q)
    return NextResponse.json(candidates)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
