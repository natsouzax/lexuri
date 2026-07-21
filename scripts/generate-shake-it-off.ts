// music-shake-it-off tem legendas desativadas pelo uploader no YouTube —
// nenhuma fonte de scraping resolve isso (confirmado: todas as 6 fontes
// falharam com "Transcript is disabled on this video"). Letra inserida
// manualmente, no mesmo formato que o gerador automático produz, com os
// chunks passando pelo mesmo pipeline de IA (analyzeChunks).
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { analyzeChunks } from '../lib/chunks'
import type { StaticLesson } from '../lib/featured-lesson'
import type { TranscriptSegment } from '../lib/types'

const FEED_ITEM_ID = 'music-shake-it-off'
const VIDEO_ID = 'mvVBuG4IOW4'
const NATIVE_LANG = 'Portuguese'

// { text, start (s), duration (s) } — timing estimada sobre a duração real
// da faixa (~3:39), estrutura de verso/refrão do lançamento oficial (2014).
const LINES: [string, number, number][] = [
  ["I stay out too late", 16, 2.2],
  ["Got nothing in my brain", 18.2, 2.3],
  ["That's what people say, mmm", 20.5, 2.5],
  ["That's what people say, mmm", 23, 2.5],
  ["I go on too many dates", 25.5, 2.3],
  ["But I can't make them stay", 27.8, 2.3],
  ["At least that's what people say, mmm", 30.1, 2.9],
  ["That's what people say, mmm", 33, 2.9],
  ["But I keep cruising", 36, 2],
  ["Can't stop, won't stop moving", 38, 2.6],
  ["It's like I got this music in my mind", 40.6, 3],
  ["Saying, \"It's gonna be alright\"", 43.6, 2.6],
  ["'Cause the players gonna play, play, play, play, play", 46.2, 3.4],
  ["And the haters gonna hate, hate, hate, hate, hate", 49.6, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 53, 3.4],
  ["I shake it off, I shake it off", 56.4, 3],
  ["Heartbreakers gonna break, break, break, break, break", 59.4, 3.4],
  ["And the fakers gonna fake, fake, fake, fake, fake", 62.8, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 66.2, 3.4],
  ["I shake it off, I shake it off", 69.6, 3],
  ["I never miss a beat", 74, 2],
  ["I'm lightning on my feet", 76, 2.2],
  ["And that's what they don't see, mmm", 78.2, 2.6],
  ["That's what they don't see, mmm", 80.8, 2.6],
  ["I'm dancing on my own", 83.4, 2.2],
  ["I make the moves up as I go", 85.6, 2.6],
  ["And that's what they don't know, mmm", 88.2, 2.7],
  ["That's what they don't know, mmm", 90.9, 2.7],
  ["But I keep cruising", 93.9, 2],
  ["Can't stop, won't stop grooving", 95.9, 2.6],
  ["It's like I got this music in my mind", 98.5, 3],
  ["Saying, \"It's gonna be alright\"", 101.5, 2.6],
  ["'Cause the players gonna play, play, play, play, play", 104.1, 3.4],
  ["And the haters gonna hate, hate, hate, hate, hate", 107.5, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 110.9, 3.4],
  ["I shake it off, I shake it off", 114.3, 3],
  ["Heartbreakers gonna break, break, break, break, break", 117.3, 3.4],
  ["And the fakers gonna fake, fake, fake, fake, fake", 120.7, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 124.1, 3.4],
  ["I shake it off, I shake it off", 127.5, 3],
  ["Shake it off, I shake it off", 132, 2.6],
  ["Shake it off, I shake it off", 135.5, 2.6],
  ["Shake it off, I shake it off", 138.9, 2.6],
  ["Shake it off, I shake it off", 142.3, 2.9],
  ["Hey, hey, hey", 146.5, 2],
  ["Just think while you've been getting down and out about the liars", 149, 3.6],
  ["And the dirty, dirty cheats of the world", 152.8, 2.8],
  ["You could've been getting down to this sick beat", 155.8, 3],
  ["My ex-man brought his new girlfriend", 159.2, 2.6],
  ["She's like, \"Oh my God\", but I'm just gonna shake", 161.8, 3],
  ["And to the fella over there with the hella good hair", 165, 3],
  ["Won't you come on over, baby? We can shake, shake, shake", 168, 3.4],
  ["Yeah, oh, 'cause the players gonna play, play, play, play, play", 171.6, 3.6],
  ["And the haters gonna hate, hate, hate, hate, hate", 175.4, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 178.8, 3.4],
  ["I shake it off, I shake it off", 182.2, 3],
  ["Heartbreakers gonna break, break, break, break, break", 185.2, 3.4],
  ["And the fakers gonna fake, fake, fake, fake, fake", 188.6, 3.4],
  ["Baby, I'm just gonna shake, shake, shake, shake, shake", 192, 3.4],
  ["I shake it off, I shake it off", 195.4, 3],
  ["Shake it off, I shake it off", 199.6, 2.6],
  ["Shake it off, I shake it off", 203, 2.6],
  ["Shake it off, I shake it off", 206.4, 2.6],
  ["Shake it off, I shake it off", 209.8, 3],
]

function lessonFile(id: string): string {
  return join(__dirname, '../data/featured-lessons', `${id}.ts`)
}

function serialize(lesson: StaticLesson): string {
  return `// Inserido manualmente — legendas desativadas pelo uploader no YouTube
// (todas as fontes de scraping falham com "Transcript is disabled").
// Chunks gerados pelo mesmo pipeline de IA (analyzeChunks) — ${lesson.generated_at.slice(0, 10)}
import type { StaticLesson } from '@/lib/featured-lesson'

const data: StaticLesson = ${JSON.stringify(lesson, null, 2)}

export default data
`
}

async function main() {
  const segments: TranscriptSegment[] = LINES.map(([text, start, duration]) => ({ text, start, duration }))
  const transcript = segments.map((s) => s.text).join('\n')

  console.log(`Analyzing chunks for ${FEED_ITEM_ID} (${transcript.length} chars)...`)
  const { chunks } = await analyzeChunks(transcript, NATIVE_LANG)
  console.log(`Done — ${chunks.length} chunks.`)

  const lesson: StaticLesson = {
    feed_item_id: FEED_ITEM_ID,
    video_id: VIDEO_ID,
    transcript,
    segments,
    chunks,
    generated_at: new Date().toISOString(),
  }

  await writeFile(lessonFile(FEED_ITEM_ID), serialize(lesson), 'utf8')
  console.log(`Wrote ${FEED_ITEM_ID}.ts`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
