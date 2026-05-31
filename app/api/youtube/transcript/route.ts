import { NextResponse } from 'next/server'
import { getTranscript } from '@/lib/youtube'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url: string }
    if (!body.url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
    const data = await getTranscript(body.url)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
