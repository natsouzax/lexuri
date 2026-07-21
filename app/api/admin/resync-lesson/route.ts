import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@/lib/supabase-server'
import { getTranscript } from '@/lib/media/youtube'
import { analyzeChunks } from '@/lib/chunks'
import { getFeedItem } from '@/lib/feed'
import type { StaticLesson } from '@/lib/featured-lesson'

const NATIVE_LANG = 'Portuguese'

// Só funciona rodando local (`npm run dev`) — usa o filesystem real (não
// existe em produção/Vercel, que é somente leitura) e o IP residencial de
// quem estiver rodando (o scraping trava no IP de datacenter da Vercel).
// É a versão "botão no app" dos scripts que rodei manualmente durante essa
// sessão pra gerar/corrigir as lições.
function serialize(lesson: StaticLesson): string {
  return `// Ressincronizado via /api/admin/resync-lesson — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Só disponível rodando localmente (npm run dev).' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { feedItemId?: string }
  const feedItemId = body.feedItemId
  if (!feedItemId) return NextResponse.json({ error: 'feedItemId is required.' }, { status: 400 })

  const item = getFeedItem(feedItemId)
  if (!item) return NextResponse.json({ error: 'Feed item not found.' }, { status: 404 })

  try {
    const { transcript, segments } = await getTranscript(`https://www.youtube.com/watch?v=${item.youtube_id}`)
    const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)

    const lesson: StaticLesson = {
      feed_item_id: feedItemId,
      video_id: item.youtube_id,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }

    const filePath = join(process.cwd(), 'data', 'featured-lessons', `${feedItemId}.ts`)
    await writeFile(filePath, serialize(lesson), 'utf8')

    return NextResponse.json({ ok: true, segments: segments.length, chunks: chunks.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
