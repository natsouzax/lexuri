// Registry of all generated static lessons.
// Used by the API route as a fast-path shortcut (zero DB/AI calls).
// Individual files are populated by: npm run generate:lessons
//
// Curadoria MVP (2026-07-21): só as 13 músicas com sync e chunks verificados.
// Removidas: believer (transcript vazio), sweet-child (sync errada),
// californication (legenda truncada), come-together/in-my-life/yesterday
// (maintenance) e os 3 vídeos (fora da hipótese música).
import type { StaticLesson } from '@/lib/featured-lesson'

import musicHappy            from './music-happy'
import musicRoar             from './music-roar'
import musicShakeItOff       from './music-shake-it-off'
import musicSomewhereRainbow from './music-somewhere-rainbow'
import musicFixYou           from './music-fix-you'
import musicHallOfFame       from './music-hall-of-fame'
import musicSomeoneLikeYou   from './music-someone-like-you'
import musicByTheWay         from './music-by-the-way'
import musicRollingInTheDeep from './music-rolling-in-the-deep'
import musicUnderTheBridge   from './music-under-the-bridge'
import musicStressedOut      from './music-stressed-out'
import musicHelloAdele       from './music-hello-adele'
import musicHotelCalifornia  from './music-hotel-california'

const ALL: Array<StaticLesson | null> = [
  musicHappy,
  musicRoar,
  musicShakeItOff,
  musicSomewhereRainbow,
  musicFixYou,
  musicHallOfFame,
  musicSomeoneLikeYou,
  musicByTheWay,
  musicRollingInTheDeep,
  musicUnderTheBridge,
  musicStressedOut,
  musicHelloAdele,
  musicHotelCalifornia,
]

export const STATIC_LESSONS: Record<string, StaticLesson> = Object.fromEntries(
  ALL.filter((l): l is StaticLesson => l !== null).map((l) => [l.feed_item_id, l]),
)

export function getStaticLesson(id: string): StaticLesson | null {
  return STATIC_LESSONS[id] ?? null
}
