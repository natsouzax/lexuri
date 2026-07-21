// Regenera todas as lições do feed curado. Pra música, tenta primeiro a
// legenda "de qualidade" (verificada por humano, ou marcada com ♪ — a mesma
// que aparece se você clicar CC no youtube.com); só cai pro genérico se essa
// não existir. É a diferença entre pegar a legenda "oficial" do vídeo vs uma
// transcrição automática qualquer.
//
// PRECISA do `npm run dev` rodando em paralelo (localhost:3000) — a busca de
// legenda de música passa por uma rota interna do próprio app.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getTranscriptFast, getMusicCaptions } from '../lib/media/youtube'
import { analyzeChunks } from '../lib/chunks'
import rawItems from '../data/feed-items.json'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'
const DATA_DIR = join(__dirname, '../data/featured-lessons')

interface RawItem {
  id: string
  youtube_id: string
  type: string
  featured?: boolean
}

const items = (rawItems as RawItem[]).filter((item) => item.featured)

function lessonFile(id: string): string {
  return join(DATA_DIR, `${id}.ts`)
}

function serialize(lesson: StaticLesson, source: string): string {
  return `// Fonte: ${source} — timing 100% original do vídeo, sem repair por IA — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  console.log(`Regenerating ${items.length} featured lessons...\n`)
  let ok = 0
  const failed: string[] = []

  for (const item of items) {
    try {
      let segments: TranscriptSegment[] | null = null
      let source = 'generic (getTranscriptFast)'

      if (item.type === 'music') {
        console.log(`[${item.id}] Trying high-quality music captions (human/♪-marked)...`)
        segments = await getMusicCaptions(item.youtube_id)
        if (segments) source = 'music captions (human or ♪-marked)'
      }

      if (!segments) {
        console.log(`[${item.id}] Fetching generic transcript...`)
        const { data } = await getTranscriptFast(`https://www.youtube.com/watch?v=${item.youtube_id}`)
        segments = data.segments
      }

      const transcript = segments.map((s) => s.text).join('\n')
      console.log(`  ${transcript.length} chars via ${source}. Analyzing chunks...`)
      const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
      console.log(`  Done — ${chunks.length} chunks.`)

      const lesson: StaticLesson = {
        feed_item_id: item.id,
        video_id: item.youtube_id,
        transcript,
        segments,
        chunks,
        generated_at: new Date().toISOString(),
      }

      await writeFile(lessonFile(item.id), serialize(lesson, source), 'utf8')
      console.log(`  Wrote ${item.id}.ts\n`)
      ok++
    } catch (err) {
      console.error(`  [${item.id}] FAILED:`, err instanceof Error ? err.message.slice(0, 150) : err)
      failed.push(item.id)
    }
  }

  console.log(`\nDone: ${ok}/${items.length} regenerated.`)
  if (failed.length) console.log('Failed (kept old data):', failed.join(', '))
}

main().catch((err) => { console.error(err); process.exit(1) })
