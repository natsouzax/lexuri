// music-roar tem legenda desativada pelo uploader (mesmo caso do
// Shake It Off) — letra sincronizada real via lrclib.net.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { fetchFromLrcLib } from '../lib/media/lyrics/providers/lrclib'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'
const FEED_ITEM_ID = 'music-roar'
const VIDEO_ID = 'e9SeJIgWRPk'

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Sincronizado via lrclib.net (legenda desativada no YouTube) — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  console.log(`[${FEED_ITEM_ID}] Fetching synced lyrics from lrclib...`)
  const lyrics = await fetchFromLrcLib('Katy Perry', 'Roar')
  if (!lyrics || lyrics.lines.length === 0) {
    console.error(`[${FEED_ITEM_ID}] No synced lyrics found.`)
    process.exit(1)
  }
  console.log(`  Got ${lyrics.lines.length} synced lines.`)

  const lines = lyrics.lines.filter((l) => l.text.trim())
  const segments: TranscriptSegment[] = lines.map((l, i) => {
    const next = lines[i + 1]
    const duration = next ? Math.min(Math.max(next.time - l.time, 0.5), 12) : 3
    return { text: l.text.trim(), start: l.time, duration }
  })
  const transcript = segments.map((s) => s.text).join('\n')

  console.log(`  Analyzing chunks (${transcript.length} chars)...`)
  const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
  console.log(`  Done — ${chunks.length} chunks.`)

  const lesson: StaticLesson = {
    feed_item_id: FEED_ITEM_ID,
    video_id: VIDEO_ID,
    transcript,
    segments,
    chunks,
    generated_at: new Date().toISOString(),
  }

  await writeFile(lessonFile(FEED_ITEM_ID), serialize(lesson), 'utf8')
  console.log(`  Wrote ${FEED_ITEM_ID}.ts`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
