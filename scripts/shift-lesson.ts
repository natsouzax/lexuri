// Aplica um deslocamento fixo (segundos) nos timestamps de uma lição já
// gerada — pra calibração manual permanente (usuário testou com os botões
// Delay/Earlier do player, achou o valor certo, aqui grava de vez).
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { STATIC_LESSONS } from '../data/featured-lessons'
import type { StaticLesson } from '../lib/featured-lesson'

const id = process.argv[2]
const deltaArg = process.argv[3]

if (!id || deltaArg === undefined) {
  console.error('Uso: npx tsx scripts/shift-lesson.ts <feed_item_id> <delta_em_segundos>')
  process.exit(1)
}

const delta = parseFloat(deltaArg)
const lesson = STATIC_LESSONS[id]
if (!lesson) {
  console.error('Lição não encontrada:', id)
  process.exit(1)
}

function lessonFile(fid: string): string {
  return join(__dirname, '../data/featured-lessons', `${fid}.ts`)
}

function serialize(l: StaticLesson): string {
  return `// Timestamps ajustados manualmente (delta ${delta > 0 ? '+' : ''}${delta}s) — ${l.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(l, null, 2)}

export default data
`
}

async function main() {
  const shifted: StaticLesson = {
    ...lesson,
    segments: lesson.segments.map((s) => ({ ...s, start: Math.max(0, s.start + delta) })),
    generated_at: new Date().toISOString(),
  }
  await writeFile(lessonFile(id), serialize(shifted), 'utf8')
  console.log(`Wrote ${id}.ts with delta ${delta}s`)
}

main()
