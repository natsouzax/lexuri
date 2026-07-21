// Verifica a sanidade dos timestamps de todas as lições estáticas: segments
// não vazio, ordem cronológica, gaps/durações plausíveis.
import { STATIC_LESSONS } from '../data/featured-lessons'

let problems = 0

for (const [id, lesson] of Object.entries(STATIC_LESSONS)) {
  const segs = lesson.segments
  const issues: string[] = []

  if (!segs || segs.length === 0) {
    issues.push('sem segments')
  } else {
    let prev = -1
    let outOfOrder = 0
    let hugeGap = 0
    for (const s of segs) {
      if (s.start < prev) outOfOrder++
      if (s.start - prev > 30 && prev >= 0) hugeGap++
      prev = s.start
    }
    if (outOfOrder > 0) issues.push(`${outOfOrder} fora de ordem`)
    if (hugeGap > 0) issues.push(`${hugeGap} gaps > 30s`)
    if (segs.length < 5) issues.push(`só ${segs.length} segments (suspeito)`)
  }

  if (!lesson.chunks || lesson.chunks.length === 0) issues.push('sem chunks')
  if (!lesson.video_id) issues.push('sem video_id')

  if (issues.length > 0) {
    problems++
    console.log(`❌ ${id}: ${issues.join(', ')}`)
  } else {
    console.log(`✅ ${id}: ${segs.length} segments, ${lesson.chunks.length} chunks, ok`)
  }
}

console.log(`\n${Object.keys(STATIC_LESSONS).length} lições checadas, ${problems} com problema.`)
