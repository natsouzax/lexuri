// As 5 faixas dos Beatles estão marcadas "maintenance" no catálogo — mesmo
// problema de legenda desativada no YouTube (confirmado pra outras faixas
// dessa sessão). Letra sincronizada real via lrclib.net. Gera o conteúdo
// pra ficar pronto, mas NÃO marca featured — fica fora do feed curado por
// enquanto, só disponível se/quando promovido.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { fetchFromLrcLib } from '../lib/media/lyrics/providers/lrclib'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'

const TARGETS = [
  { feedItemId: 'music-let-it-be',     videoId: 'QDYfEBY9NM4', title: 'Let It Be' },
  { feedItemId: 'music-hey-jude',      videoId: 'CG3jm4vvGXc', title: 'Hey Jude' },
  { feedItemId: 'music-yesterday',     videoId: 'NrgmdOz227I', title: 'Yesterday' },
  { feedItemId: 'music-come-together', videoId: 'huD8whbMRvU', title: 'Come Together' },
  { feedItemId: 'music-in-my-life',    videoId: 'YBcdt6DsLQA', title: 'In My Life' },
]
const ARTIST = 'The Beatles'

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Sincronizado via lrclib.net (legenda desativada no YouTube) — ${lesson.generated_at.slice(0, 10)}
// NÃO featured de propósito — gerado mas fora do feed curado por enquanto.
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.feedItemId}] Fetching synced lyrics from lrclib...`)
    const lyrics = await fetchFromLrcLib(ARTIST, t.title)
    if (!lyrics || lyrics.lines.length === 0) {
      console.error(`  [${t.feedItemId}] No synced lyrics found — skipping.`)
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
