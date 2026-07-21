// Re-sincroniza music-shake-it-off e music-by-the-way com letra sincronizada
// de verdade (lrclib.net — banco comunitário de LRC), em vez da legenda
// desativada do YouTube (shake it off) ou da legenda ASR corrompida/fora de
// ordem que estava cacheada no Supabase (by the way).
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { fetchFromLrcLib } from '../lib/media/lyrics/providers/lrclib'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'

const TARGETS = [
  { feedItemId: 'music-shake-it-off', videoId: 'mvVBuG4IOW4', artist: 'Taylor Swift', title: 'Shake It Off' },
  { feedItemId: 'music-by-the-way',   videoId: 'JnfyjwChuNU', artist: 'Red Hot Chili Peppers', title: 'By the Way' },
]

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Sincronizado via lrclib.net (letra sincronizada real) — ${lesson.generated_at.slice(0, 10)}
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
      console.error(`  [${t.feedItemId}] No synced lyrics found on lrclib.`)
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
