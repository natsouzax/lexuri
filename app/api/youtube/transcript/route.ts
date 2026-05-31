import { NextResponse } from 'next/server'
import { getTranscript } from '@/lib/youtube'

export const runtime = 'nodejs'
export const maxDuration = 60

function publicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('OPENAI_API_KEY')) {
    return 'Could not fetch captions, and audio transcription fallback is not configured.'
  }
  return message
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url: string }
    if (!body.url) return NextResponse.json({ error: 'URL is required.' }, { status: 400 })
    const data = await getTranscript(body.url)
    return NextResponse.json(data)
  } catch (e) {
    console.error('[youtube/transcript]', e)
    return NextResponse.json({ error: publicErrorMessage(e) }, { status: 500 })
  }
}
