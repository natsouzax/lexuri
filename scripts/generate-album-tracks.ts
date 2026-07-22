// Gera as lições das faixas de um álbum: pra cada faixa, busca a letra
// sincronizada no lrclib.net, monta os segments, analisa os chunks e grava
// a StaticLesson + a entrada em feed-items.json (marcada com album=<id>).
//
// Roda na SUA máquina (lrclib é bloqueado no ambiente do assistente):
//   node --env-file=.env.local --import=tsx scripts/generate-album-tracks.ts
//
// PREENCHA os youtube_id antes de rodar (pegue da URL do vídeo no YouTube:
// youtube.com/watch?v=XXXXXXXXXXX → o XXXXXXXXXXX é o id).
// Nenhuma letra fica no código — vem toda do lrclib.
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { parseLrc } from '../lib/media/lyrics/parser'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'
const ALBUM_ID = 'american-idiot'
const ARTIST = 'Green Day'
const DATA_DIR = join(__dirname, '../data/featured-lessons')
const FEED_JSON = join(__dirname, '../data/feed-items.json')

// Preencha youtube_id de cada faixa. level = CEFR (B1/B2 pra Green Day).
const TRACKS: { songId: string; title: string; youtubeId: string; level: string; durationHint: number }[] = [
  { songId: 'album-ai-american-idiot', title: 'American Idiot',                    youtubeId: '', level: 'B2', durationHint: 176 },
  { songId: 'album-ai-holiday',        title: 'Holiday',                           youtubeId: '', level: 'B2', durationHint: 232 },
  { songId: 'album-ai-boulevard',      title: 'Boulevard of Broken Dreams',        youtubeId: '', level: 'B1', durationHint: 260 },
  { songId: 'album-ai-wake-me-up',     title: 'Wake Me Up When September Ends',    youtubeId: '', level: 'B1', durationHint: 285 },
  { songId: 'album-ai-whatsername',    title: 'Whatsername',                       youtubeId: '', level: 'B2', durationHint: 246 },
]

interface Hit { artistName: string; trackName: string; duration: number | null; instrumental: boolean; syncedLyrics: string | null }
interface FeedItem { id: string; type: string; title: string; artist?: string; youtube_id: string; duration: string; level: string; tags: string[]; preview: string; featured?: boolean; album?: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchRetry(url: string, tries = 4): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { headers: { 'User-Agent': 'Lexuri/1.0 (album)', Accept: 'application/json' } })
    } catch {
      await sleep(1500 * (i + 1))
    }
  }
  return null
}

async function searchLrclib(title: string): Promise<Hit[]> {
  const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(ARTIST)}`
  const res = await fetchRetry(url)
  return res?.ok ? ((await res.json()) as Hit[]) : []
}

function mmss(sec: number): string {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function serialize(lesson: StaticLesson): string {
  return `// Faixa de álbum (${ALBUM_ID}) — sincronizada via lrclib.net — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  const missing = TRACKS.filter((t) => !t.youtubeId)
  if (missing.length) {
    console.error(`\n⚠️  Faltam youtube_id em: ${missing.map((t) => t.title).join(', ')}`)
    console.error('Preencha no topo do script e rode de novo.\n')
    process.exit(1)
  }

  const feed: FeedItem[] = JSON.parse(await readFile(FEED_JSON, 'utf8'))

  for (const t of TRACKS) {
    console.log(`\n[${t.songId}] "${t.title}" — buscando no lrclib...`)
    const hits = (await searchLrclib(t.title)).filter((h) => h.syncedLyrics && !h.instrumental)
    if (hits.length === 0) { console.error('  ❌ sem letra sincronizada — pulei.'); continue }
    hits.sort((a, b) => Math.abs((a.duration ?? 0) - t.durationHint) - Math.abs((b.duration ?? 0) - t.durationHint))
    const best = hits[0]

    const lines = parseLrc(best.syncedLyrics!).filter((l) => l.text.trim())
    const segments: TranscriptSegment[] = lines.map((l, i) => {
      const next = lines[i + 1]
      const duration = next ? Math.min(Math.max(next.time - l.time, 0.5), 12) : 3
      return { text: l.text.trim(), start: Math.round(l.time * 1000) / 1000, duration }
    })
    const transcript = segments.map((s) => s.text).join('\n')

    console.log(`  ${segments.length} linhas. Analisando chunks...`)
    const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
    console.log(`  ${chunks.length} chunks.`)

    const lesson: StaticLesson = {
      feed_item_id: t.songId,
      video_id: t.youtubeId,
      transcript,
      segments,
      chunks,
      generated_at: new Date().toISOString(),
    }
    await writeFile(join(DATA_DIR, `${t.songId}.ts`), serialize(lesson), 'utf8')

    // Entrada no feed-items (marcada com album — não aparece no catálogo avulso).
    const entry: FeedItem = {
      id: t.songId,
      type: 'music',
      title: t.title,
      artist: ARTIST,
      youtube_id: t.youtubeId,
      duration: mmss(best.duration ?? t.durationHint),
      level: t.level,
      tags: ['rock', 'album', 'story'],
      preview: `Track from ${ARTIST}'s album — part of the album module.`,
      album: ALBUM_ID,
    }
    const idx = feed.findIndex((f) => f.id === t.songId)
    if (idx >= 0) feed[idx] = entry
    else feed.push(entry)
    console.log(`  ✅ ${t.songId}.ts + feed entry (${entry.duration})`)
  }

  await writeFile(FEED_JSON, JSON.stringify(feed, null, 2) + '\n', 'utf8')
  console.log('\n⚠️  Adicione os imports das novas faixas em data/featured-lessons/index.ts')
  console.log('   (o script não mexe no index pra não quebrar a ordem manual).')
}

main().catch((e) => { console.error(e); process.exit(1) })
