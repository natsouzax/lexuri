import { NextResponse } from 'next/server'
import { searchLrcLib } from '@/lib/lyrics'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    if (!q?.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 })
    }

    const hits = await searchLrcLib(q)
    return NextResponse.json(hits)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
