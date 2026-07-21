// Terceira leva — só candidatas verificadas com legenda REAL do YouTube,
// texto conferido manualmente (letra certa, completa, sem ASR errado).
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getTranscript } from '../lib/media/youtube'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'

const NATIVE_LANG = 'Portuguese'

const TARGETS = [
  { feedItemId: 'music-rolling-in-the-deep', youtubeId: 'rYEDA3JcQqw' },
  { feedItemId: 'video-kurzgesagt-nihilism', youtubeId: 'MBRqu0YOH14' },
  { feedItemId: 'music-californication',     youtubeId: 'YlUKcNNmywk' },
]

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Auto-generated (legenda real do YouTube, texto verificado) — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.feedItemId}] Fetching transcript...`)
    const { transcript, segments } = await getTranscript(`https://www.youtube.com/watch?v=${t.youtubeId}`)
    console.log(`  ${transcript.length} chars. Analyzing chunks...`)
    const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
    console.log(`  Done — ${chunks.length} chunks.`)

    const lesson: StaticLesson = {
      feed_item_id: t.feedItemId,
      video_id: t.youtubeId,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }

    await writeFile(lessonFile(t.feedItemId), serialize(lesson), 'utf8')
    console.log(`  Wrote ${t.feedItemId}.ts`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
