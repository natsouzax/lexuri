import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { analyzeChunks } from '@/lib/chunks'
import { FEED_ITEMS } from '@/lib/feed'
import type { StaticLesson } from '@/lib/featured-lesson'
import type { TranscriptSegment } from '@/lib/types'

const NATIVE_LANG = 'Portuguese'

// Recebe a legenda capturada por VOCÊ, no SEU navegador de verdade (via o
// snippet colado no Console do DevTools enquanto assiste o vídeo no
// youtube.com) — nunca por automação, então nunca esbarra no PoToken.
// Só existe em dev local (NODE_ENV=development); libera CORS pro
// youtube.com porque é de lá que o snippet manda a requisição.

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://www.youtube.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 403 })
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

function serialize(lesson: StaticLesson, quality: string): string {
  return `// Capturado no navegador real via snippet do Console (${quality}) — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

export async function POST(request: Request) {
  const headers = corsHeaders()

  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Só disponível rodando localmente (npm run dev).' }, { status: 403, headers })
  }

  const body = (await request.json()) as {
    videoId?: string
    segments?: TranscriptSegment[]
    isASR?: boolean
    hasMusicalSymbol?: boolean
  }

  const { videoId, segments, isASR, hasMusicalSymbol } = body
  if (!videoId || !segments?.length) {
    return NextResponse.json({ error: 'videoId and segments are required.' }, { status: 400, headers })
  }

  const item = FEED_ITEMS.find((i) => i.youtube_id === videoId)
  if (!item) {
    return NextResponse.json({ error: `Nenhuma lição do feed usa o vídeo ${videoId}.` }, { status: 404, headers })
  }

  try {
    const transcript = segments.map((s) => s.text).join('\n')
    const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)

    const lesson: StaticLesson = {
      feed_item_id: item.id,
      video_id: videoId,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }

    const quality = hasMusicalSymbol ? 'com símbolo ♪' : isASR ? 'ASR' : 'humana'
    const filePath = join(process.cwd(), 'data', 'featured-lessons', `${item.id}.ts`)
    await writeFile(filePath, serialize(lesson, quality), 'utf8')

    return NextResponse.json(
      { ok: true, feedItemId: item.id, segments: segments.length, chunks: chunks.length },
      { headers },
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers })
  }
}
