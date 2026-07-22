// Re-roda SÓ a análise de chunks (lib/chunks.ts) em cima do transcript/
// segments JÁ CORRETOS de cada lição do catálogo — não mexe em sync nem
// re-busca legenda. Existe pra aplicar melhorias no algoritmo de chunks
// (densidade, contrações como "let's go" tratadas como unidade única) às
// lições que já estavam prontas, sem arriscar quebrar a sincronização.
//
// Uso: node --env-file=.env.local --import=tsx scripts/regenerate-chunks-only.ts
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { STATIC_LESSONS } from '../data/featured-lessons'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'

const NATIVE_LANG = 'Portuguese'
const DATA_DIR = join(__dirname, '../data/featured-lessons')

function lessonFile(id: string): string {
  return join(DATA_DIR, `${id}.ts`)
}

function serialize(lesson: StaticLesson, headerNote: string): string {
  return `// ${headerNote} — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  const ids = Object.keys(STATIC_LESSONS)
  console.log(`Re-analyzing chunks for ${ids.length} lessons (sync untouched)...\n`)

  for (const id of ids) {
    const lesson = STATIC_LESSONS[id]
    console.log(`[${id}] ${lesson.chunks.length} chunks -> analyzing...`)
    try {
      const { chunks } = await analyzeChunks(lesson.transcript, NATIVE_LANG)
      const updated: StaticLesson = { ...lesson, chunks, generated_at: new Date().toISOString() }
      await writeFile(lessonFile(id), serialize(updated, 'Chunks re-analisados (densidade + contrações)'), 'utf8')
      console.log(`  -> ${chunks.length} chunks. Wrote ${id}.ts`)
    } catch (e) {
      console.error(`  FAILED:`, e)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
