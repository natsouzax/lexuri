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
import { existsSync } from 'fs'
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
  { songId: 'album-ai-american-idiot', title: 'American Idiot',                    youtubeId: 'h6Z5N0Z6zH0&list=PLXjISBGUSATW6Tk78Sd6ANRIOqKZ5EYe3', level: 'B2', durationHint: 176 },
  { songId: 'album-ai-holiday',        title: 'Holiday',                           youtubeId: 'l2hA8g1cNvQ&list=PLXjISBGUSATW6Tk78Sd6ANRIOqKZ5EYe3&index=3', level: 'B2', durationHint: 232 },
  { songId: 'album-ai-boulevard',      title: 'Boulevard of Broken Dreams',        youtubeId: 'Dx1SPxGn-iU&list=PLXjISBGUSATW6Tk78Sd6ANRIOqKZ5EYe3&index=4', level: 'B1', durationHint: 260 },
  { songId: 'album-ai-wake-me-up',     title: 'Wake Me Up When September Ends',    youtubeId: 'rdpBZ5_b48g&list=PLXjISBGUSATW6Tk78Sd6ANRIOqKZ5EYe3&index=11', level: 'B1', durationHint: 285 },
  { songId: 'album-ai-whatsername',    title: 'Whatsername',                       youtubeId: 'XJdYn3VyAkQ&list=PLXjISBGUSATW6Tk78Sd6ANRIOqKZ5EYe3&index=13', level: 'B2', durationHint: 246 },
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
  // 1) busca estrita (track + artist)
  const strict = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(ARTIST)}`
  const r1 = await fetchRetry(strict)
  if (r1?.ok) {
    const arr = (await r1.json()) as Hit[]
    if (arr.some((h) => h.syncedLyrics)) return arr
  }
  // 2) fallback: busca livre "title artist" (pega variações de metadados)
  const loose = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${ARTIST}`)}`
  const r2 = await fetchRetry(loose)
  if (r2?.ok) {
    const arr = ((await r2.json()) as Hit[]).filter(
      (h) => h.artistName?.toLowerCase().includes(ARTIST.toLowerCase().split(' ')[0]),
    )
    if (arr.some((h) => h.syncedLyrics)) return arr
  }
  return []
}

function mmss(sec: number): string {
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Aceita o que o usuário colar: só o id, id+lixo de playlist (&list=…&index=…),
// ou a URL inteira (watch?v=…, youtu.be/…). Extrai o id de 11 chars.
function extractVideoId(raw: string): string | null {
  const s = raw.trim()
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,      // youtube.com/watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
    /embed\/([A-Za-z0-9_-]{11})/,     // youtube.com/embed/ID
    /^([A-Za-z0-9_-]{11})/,           // ID no começo (id ou id&list=…)
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) return m[1]
  }
  return null
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

  // Limpa/valida os youtube_id (aceita URL, id+playlist, etc).
  const badIds = TRACKS.filter((t) => !extractVideoId(t.youtubeId))
  if (badIds.length) {
    console.error(`\n⚠️  youtube_id inválido em: ${badIds.map((t) => t.title).join(', ')}`)
    console.error('Cole a URL do vídeo ou o id de 11 caracteres.\n')
    process.exit(1)
  }

  const feed: FeedItem[] = JSON.parse(await readFile(FEED_JSON, 'utf8'))

  for (const t of TRACKS) {
    const videoId = extractVideoId(t.youtubeId)!
    // Pula faixas já geradas (rerun só busca o que falta — poupa OpenAI).
    if (existsSync(join(DATA_DIR, `${t.songId}.ts`))) {
      console.log(`\n[${t.songId}] já existe — pulei (apague o arquivo pra refazer).`)
      continue
    }
    console.log(`\n[${t.songId}] "${t.title}" (${videoId}) — buscando no lrclib...`)
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
      video_id: videoId,
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
      youtube_id: videoId,
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
