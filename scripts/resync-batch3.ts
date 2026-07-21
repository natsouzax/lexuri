// Re-sincroniza músicas com problemas de qualidade/sync via lrclib.net
// (letra sincronizada real), usando o endpoint /search (fuzzy) e escolhendo
// o hit sincronizado com duração mais próxima do vídeo. Re-analisa chunks.
//
// Uso: node --env-file=.env.local --import=tsx scripts/resync-batch3.ts
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { parseLrc } from '../lib/media/lyrics/parser'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'

// durationHint = duração aproximada da faixa (s), pra escolher o LRC certo.
const TARGETS = [
  { feedItemId: 'music-roar',             videoId: 'e9SeJIgWRPk', artist: 'Katy Perry',            title: 'Roar',            durationHint: 223 },
  { feedItemId: 'music-fix-you',          videoId: 'SIelMFCVJLI', artist: 'Coldplay',              title: 'Fix You',         durationHint: 295 },
  { feedItemId: 'music-under-the-bridge', videoId: 'GLvohMXgcBo', artist: 'Red Hot Chili Peppers', title: 'Under the Bridge', durationHint: 264 },
]

interface Hit {
  artistName: string
  trackName: string
  duration: number | null
  syncedLyrics: string | null
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchRetry(url: string, tries = 4): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { headers: { 'User-Agent': 'Lexuri/1.0 (validation)', 'Accept': 'application/json' } })
    } catch (e) {
      console.log(`    fetch attempt ${i + 1} failed (${(e as Error).message}); retrying…`)
      await sleep(1500 * (i + 1))
    }
  }
  return null
}

async function searchLrclib(artist: string, title: string): Promise<Hit[]> {
  // /search (fuzzy) primeiro; se falhar, /get exato como fallback.
  const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
  const res = await fetchRetry(searchUrl)
  if (res?.ok) {
    const arr = (await res.json()) as Hit[]
    if (arr.length) return arr
  }
  const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
  const res2 = await fetchRetry(getUrl)
  if (res2?.ok) {
    const one = (await res2.json()) as Hit
    if (one?.syncedLyrics) return [one]
  }
  return []
}

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.feedItemId}] Searching lrclib for "${t.artist} - ${t.title}"...`)
    const hits = (await searchLrclib(t.artist, t.title)).filter((h) => h.syncedLyrics)
    if (hits.length === 0) {
      console.error(`  No synced result — SKIP.`)
      continue
    }
    // Escolhe o hit sincronizado com duração mais próxima do vídeo.
    hits.sort((a, b) => Math.abs((a.duration ?? 0) - t.durationHint) - Math.abs((b.duration ?? 0) - t.durationHint))
    const best = hits[0]
    console.log(`  Best: ${best.artistName} - ${best.trackName} (${best.duration}s)`)

    const lrcLines = parseLrc(best.syncedLyrics!).filter((l) => l.text.trim())
    const segments: TranscriptSegment[] = lrcLines.map((l, i) => {
      const next = lrcLines[i + 1]
      const duration = next ? Math.min(Math.max(next.time - l.time, 0.5), 12) : 3
      return { text: l.text.trim(), start: Math.round(l.time * 1000) / 1000, duration }
    })
    const transcript = segments.map((s) => s.text).join('\n')

    console.log(`  ${segments.length} lines. Analyzing chunks (${transcript.length} chars)...`)
    const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
    console.log(`  ${chunks.length} chunks.`)

    const lesson: StaticLesson = {
      feed_item_id: t.feedItemId,
      video_id: t.videoId,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }
    await writeFile(lessonFile(t.feedItemId), serialize(lesson), 'utf8')
    console.log(`  ✅ Wrote ${t.feedItemId}.ts — first line at ${segments[0].start.toFixed(1)}s, last at ${segments[segments.length - 1].start.toFixed(1)}s`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
