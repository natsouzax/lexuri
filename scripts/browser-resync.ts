// Captura a legenda "oficial" do YouTube (a mesma que aparece se você clicar
// CC no youtube.com — prioriza a marcada com ♪/verificada por humano) usando
// um navegador de verdade (Playwright/Chromium) rodando NA SUA MÁQUINA. Isso
// contorna tanto o bloqueio de IP de datacenter quanto o PoToken — nenhum
// dos dois se aplica a um navegador real com sessão/cookies reais.
//
// Uso: npx tsx --env-file=.env.local scripts/browser-resync.ts [feed_item_id ...]
// Sem argumentos, roda em todas as lições featured do feed-items.json.
import { chromium } from 'playwright'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { analyzeChunks } from '../lib/chunks'
import rawItems from '../data/feed-items.json'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'
const DATA_DIR = join(__dirname, '../data/featured-lessons')

interface RawItem {
  id: string
  youtube_id: string
  type: string
  featured?: boolean
}

interface CaptionTrack {
  baseUrl: string
  languageCode: string
  kind?: string
}

function lessonFile(id: string): string {
  return join(DATA_DIR, `${id}.ts`)
}

function serialize(lesson: StaticLesson, hasMusicalSymbol: boolean, isASR: boolean): string {
  const quality = hasMusicalSymbol ? 'com símbolo ♪' : isASR ? 'automática (ASR)' : 'humana'
  return `// Capturado via navegador real (Playwright) — legenda ${quality} — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function captureOne(page: import('playwright').Page, item: RawItem) {
  console.log(`\n[${item.id}] Opening https://www.youtube.com/watch?v=${item.youtube_id} ...`)
  await page.goto(`https://www.youtube.com/watch?v=${item.youtube_id}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500) // deixa o player carregar ytInitialPlayerResponse

  const tracks = await page.evaluate(() => {
    const w = window as unknown as { ytInitialPlayerResponse?: { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } } } }
    return w.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? null
  })

  if (!tracks?.length) throw new Error('Nenhuma faixa de legenda encontrada nessa página.')

  const enHuman = tracks.find((t) => t.languageCode?.startsWith('en') && t.kind !== 'asr')
  const enAsr   = tracks.find((t) => t.languageCode?.startsWith('en'))
  const best    = enHuman ?? enAsr ?? tracks[0]
  const isASR   = best.kind === 'asr' || !enHuman

  const captionUrl = `${best.baseUrl}&fmt=json3`

  // Busca de dentro da própria página — mesma sessão/cookies/PoToken do navegador real.
  const captText: string = await page.evaluate(async (url) => {
    for (const method of ['GET', 'POST']) {
      try {
        const res = await fetch(url, { method })
        const text = await res.text()
        if (text) return text
      } catch { /* tenta o próximo método */ }
    }
    return ''
  }, captionUrl)

  if (!captText) throw new Error('Corpo da legenda veio vazio (mesmo dentro do navegador).')

  const captData = JSON.parse(captText) as {
    events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8: string }> }>
  }

  const segments: TranscriptSegment[] = (captData.events ?? [])
    .filter((e) => e.segs?.length && e.tStartMs !== undefined)
    .map((e) => ({
      text: e.segs!.map((s) => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim(),
      start: (e.tStartMs ?? 0) / 1000,
      duration: Math.max(0.1, (e.dDurationMs ?? 2000) / 1000),
    }))
    .filter((s) => s.text)

  if (!segments.length) throw new Error('Zero segments após parse.')

  const hasMusicalSymbol = segments.some((s) => s.text.includes('♪') || s.text.includes('🎵'))
  return { segments, isASR, hasMusicalSymbol }
}

async function main() {
  const requestedIds = process.argv.slice(2)
  const all = (rawItems as RawItem[]).filter((i) => i.featured)
  const items = requestedIds.length ? all.filter((i) => requestedIds.includes(i.id)) : all

  console.log(`Capturando ${items.length} lições via navegador real...`)

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  })

  let ok = 0
  const failed: string[] = []

  for (const item of items) {
    try {
      const { segments, isASR, hasMusicalSymbol } = await captureOne(page, item)
      const transcript = segments.map((s) => s.text).join('\n')
      console.log(`  ${segments.length} segments, ${transcript.length} chars (${hasMusicalSymbol ? '♪ marked' : isASR ? 'ASR' : 'human'}). Analyzing chunks...`)

      const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
      console.log(`  Done — ${chunks.length} chunks.`)

      const lesson: StaticLesson = {
        feed_item_id: item.id,
        video_id: item.youtube_id,
        transcript,
        segments,
        chunks,
        generated_at: new Date().toISOString(),
      }

      await writeFile(lessonFile(item.id), serialize(lesson, hasMusicalSymbol, isASR), 'utf8')
      console.log(`  Wrote ${item.id}.ts`)
      ok++
    } catch (err) {
      console.error(`  [${item.id}] FAILED:`, err instanceof Error ? err.message : err)
      failed.push(item.id)
    }
  }

  await browser.close()

  console.log(`\nDone: ${ok}/${items.length} captured.`)
  if (failed.length) console.log('Failed (kept old data):', failed.join(', '))
}

main().catch((err) => { console.error(err); process.exit(1) })
