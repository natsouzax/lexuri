import { NextResponse } from 'next/server'
import { getUserFromBearer } from '@/lib/auth-bearer'
import { transcriptCache } from '@/lib/media/youtube'
import type { TranscriptSegment } from '@/lib/types'

// Recebe legendas capturadas pela extensão de Chrome (rodando no youtube.com,
// com o IP residencial de quem está assistindo — nunca bloqueado pelo YouTube
// do jeito que um datacenter é). Só primes o cache compartilhado
// (youtube_transcript_cache); getTranscript()/getTranscriptFast() em
// lib/media/youtube/services/transcript.ts já checam esse cache antes de
// tentar raspar — então isso "resolve" o vídeo pra todo mundo (web, win, etc)
// sem precisar mudar a cadeia de fallback existente.

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

function corsHeaders(origin: string | null) {
  const allowed = origin && origin.startsWith('chrome-extension://') ? origin : ''
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) })
}

export async function POST(request: Request) {
  const headers = corsHeaders(request.headers.get('origin'))

  const user = await getUserFromBearer(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  let body: { videoId?: unknown; segments?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers })
  }

  const { videoId, segments } = body
  if (typeof videoId !== 'string' || !VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400, headers })
  }
  if (!Array.isArray(segments) || segments.length === 0 || segments.length > 5000) {
    return NextResponse.json({ error: 'Invalid segments' }, { status: 400, headers })
  }

  const clean: TranscriptSegment[] = []
  let totalChars = 0
  for (const s of segments) {
    if (
      !s ||
      typeof s.text !== 'string' ||
      typeof s.start !== 'number' ||
      typeof s.duration !== 'number' ||
      !Number.isFinite(s.start) ||
      !Number.isFinite(s.duration)
    ) {
      return NextResponse.json({ error: 'Invalid segment shape' }, { status: 400, headers })
    }
    const text = s.text.trim()
    if (!text) continue
    totalChars += text.length
    clean.push({ text, start: s.start, duration: s.duration })
  }

  if (totalChars < 10 || totalChars > 300_000 || clean.length === 0) {
    return NextResponse.json({ error: 'Transcript out of expected size range' }, { status: 400, headers })
  }

  const existing = await transcriptCache.get(videoId)
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'already cached' }, { headers })
  }

  await transcriptCache.set(videoId, clean)

  return NextResponse.json({ ok: true, skipped: false }, { headers })
}
