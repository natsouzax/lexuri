// Rainbow e Hotel California tinham legenda REAL do YouTube (ancorada no
// vídeo certo), só que em blocos gigantes (uma "linha" de 40-67s). Em vez de
// usar o lrclib (que pode ter um intro/offset diferente desse upload
// específico), recupera os blocos originais e divide cada um em sub-linhas
// usando quebras de frase, interpolando o tempo PROPORCIONALMENTE dentro da
// janela real [start, start+duration] de cada bloco — mantém a ancoragem
// real do vídeo, só melhora a granularidade.
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getTranscript } from '../lib/media/youtube'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const NATIVE_LANG = 'Portuguese'

const TARGETS = [
  { feedItemId: 'music-somewhere-rainbow', youtubeId: 'V1bFr2SWP1I' },
  { feedItemId: 'music-hotel-california',  youtubeId: 'dLl4PZtxia8' },
]

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Blocos originais do YouTube (ancorados no vídeo certo) divididos em
// sub-linhas por interpolação proporcional — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

// Quebra um bloco de texto em frases/linhas menores (por pontuação, vírgula,
// ou a cada ~8 palavras se não tiver pontuação) e distribui o tempo do bloco
// proporcionalmente ao tamanho de cada pedaço.
function splitBlock(seg: TranscriptSegment): TranscriptSegment[] {
  const raw = seg.text.trim()
  let parts = raw.split(/(?<=[.,!?;:])\s+/).filter(Boolean)
  if (parts.length <= 1) {
    // sem pontuação útil — quebra a cada ~8 palavras
    const words = raw.split(/\s+/)
    parts = []
    for (let i = 0; i < words.length; i += 8) parts.push(words.slice(i, i + 8).join(' '))
  }
  if (parts.length <= 1) return [seg]

  const totalChars = parts.reduce((sum, p) => sum + p.length, 0)
  const out: TranscriptSegment[] = []
  let cursor = seg.start
  for (const part of parts) {
    const share = part.length / totalChars
    const dur = Math.max(0.6, seg.duration * share)
    out.push({ text: part.trim(), start: cursor, duration: dur })
    cursor += dur
  }
  return out
}

async function main() {
  for (const t of TARGETS) {
    console.log(`\n[${t.feedItemId}] Fetching original YouTube captions...`)
    const { segments: rawSegments } = await getTranscript(`https://www.youtube.com/watch?v=${t.youtubeId}`)
    console.log(`  ${rawSegments.length} original blocks.`)

    const segments = rawSegments.flatMap(splitBlock)
    console.log(`  ${segments.length} segments after splitting.`)

    const transcript = segments.map((s) => s.text).join('\n')

    console.log(`  Analyzing chunks (${transcript.length} chars)...`)
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

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
