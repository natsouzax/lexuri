// music-somewhere-rainbow e music-hotel-california vieram com legenda em
// blocos gigantes (uma linha ficando 40-60s na tela) — dado de origem ruim
// do YouTube, não relacionado ao bug do player. Re-sincroniza com letra
// linha-a-linha real do lrclib.net. music-hello-adele incluída por precaução.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { fetchFromLrcLib } from '../lib/media/lyrics/providers/lrclib'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'

const TARGETS = [
  { feedItemId: 'music-somewhere-rainbow', videoId: 'V1bFr2SWP1I', artist: "Israel Kamakawiwoole", title: 'Somewhere Over the Rainbow' },
  { feedItemId: 'music-hotel-california',  videoId: 'dLl4PZtxia8', artist: 'Eagles', title: 'Hotel California' },
]

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Sincronizado via lrclib.net (a legenda original vinha em blocos gigantes, ruim) — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.feedItemId}] Fetching synced lyrics from lrclib...`)
    const lyrics = await fetchFromLrcLib(t.artist, t.title)
    if (!lyrics || lyrics.lines.length === 0) {
      console.error(`  [${t.feedItemId}] No synced lyrics found — keeping existing data.`)
      continue
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
      feed_item_id: t.feedItemId,
      video_id: t.videoId,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }

    await writeFile(lessonFile(t.feedItemId), serialize(lesson), 'utf8')
    console.log(`  Wrote ${t.feedItemId}.ts`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
