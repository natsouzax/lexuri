// Segunda leva de lições — gerado localmente (IP residencial) porque
// scraping de datacenter (Vercel) é bloqueado pelo YouTube.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getTranscript } from '../lib/media/youtube'
import { analyzeChunks } from '../lib/chunks'
import rawItems from '../data/feed-items.json'
import type { StaticLesson } from '../lib/featured-lesson'

const NATIVE_LANG = 'Portuguese'
const DATA_DIR = join(__dirname, '../data/featured-lessons')

const IDS = [
  'music-somewhere-rainbow',
  'music-roar',
  'music-someone-like-you',
  'music-believer',
  'music-hotel-california',
  'music-sweet-child-o-mine',
  'music-hello-adele',
  'music-under-the-bridge',
]

interface RawItem {
  id: string
  youtube_id: string
}

const items = (rawItems as RawItem[]).filter((item) => IDS.includes(item.id))

function lessonFile(id: string): string {
  return join(DATA_DIR, `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Auto-generated — ${lesson.generated_at.slice(0, 10)}
// Regenerate: npx tsx --env-file=.env.local scripts/generate-batch2.ts
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function generateLesson(item: RawItem): Promise<StaticLesson> {
  console.log(`\n[${item.id}] Fetching transcript...`)
  const { transcript, segments } = await getTranscript(
    `https://www.youtube.com/watch?v=${item.youtube_id}`,
  )

  console.log(`[${item.id}] ${transcript.length} chars. Analyzing chunks...`)
  const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
  console.log(`[${item.id}] Done — ${chunks.length} chunks.`)

  return {
    feed_item_id: item.id,
    video_id: item.youtube_id,
    transcript,
    segments,
    chunks,
    generated_at: new Date().toISOString(),
  }
}

async function main() {
  console.log(`Generating ${items.length} lessons...\n`)

  let ok = 0
  const failed: string[] = []
  for (const item of items) {
    try {
      const lesson = await generateLesson(item)
      await writeFile(lessonFile(item.id), serialize(lesson), 'utf8')
      console.log(`  Wrote ${item.id}.ts`)
      ok++
    } catch (err) {
      console.error(`  [${item.id}] FAILED:`, err)
      failed.push(item.id)
    }
  }

  console.log(`\nDone: ${ok}/${items.length} lessons generated.`)
  if (failed.length) console.log('Failed:', failed.join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
