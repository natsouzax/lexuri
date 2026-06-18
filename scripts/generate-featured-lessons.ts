/**
 * Generates static lesson data for all featured feed items.
 * Fetches transcripts from YouTube and analyzes chunks with GPT-4o.
 * Writes one TypeScript file per lesson to data/featured-lessons/.
 *
 * Usage:
 *   npm run generate:lessons
 *
 * Needs .env.local with: OPENAI_API_KEY, SUPADATA_API_KEY (or YOUTUBE_API_KEY)
 */

import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getTranscript } from '../lib/youtube'
import { analyzeChunks } from '../lib/chunks'
import rawItems from '../data/feed-items.json'
import type { StaticLesson } from '../lib/featured-lesson'

const NATIVE_LANG = 'Portuguese'
const DATA_DIR = join(__dirname, '../data/featured-lessons')

interface RawItem {
  id: string
  youtube_id: string
  featured?: boolean
  maintenance?: boolean
}

const featuredItems = (rawItems as RawItem[]).filter(
  (item) => item.featured && !item.maintenance,
)

function lessonFile(id: string): string {
  return join(DATA_DIR, `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Auto-generated — ${lesson.generated_at.slice(0, 10)}
// Regenerate: npm run generate:lessons
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
  console.log(`Generating ${featuredItems.length} featured lessons...\n`)

  let ok = 0
  for (const item of featuredItems) {
    try {
      const lesson = await generateLesson(item)
      await writeFile(lessonFile(item.id), serialize(lesson), 'utf8')
      console.log(`  Wrote ${item.id}.ts`)
      ok++
    } catch (err) {
      console.error(`  [${item.id}] FAILED:`, err)
    }
  }

  console.log(`\nDone: ${ok}/${featuredItems.length} lessons generated.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
