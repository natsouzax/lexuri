// Registry of all generated static lessons.
// Used by the API route as a fast-path shortcut (zero DB/AI calls).
// Individual files are populated by: npm run generate:lessons
import type { StaticLesson } from '@/lib/featured-lesson'

import musicHappy              from './music-happy'
import musicShakeItOff         from './music-shake-it-off'
import musicHallOfFame         from './music-hall-of-fame'
import musicFixYou             from './music-fix-you'
import musicStressedOut        from './music-stressed-out'
import videoKurzgesagtEgg      from './video-kurzgesagt-egg'
import videoVeritasiumParallel from './video-veritasium-parallel'
import musicByTheWay           from './music-by-the-way'
import musicSomewhereRainbow   from './music-somewhere-rainbow'
import musicRoar               from './music-roar'
import musicSomeoneLikeYou     from './music-someone-like-you'
import musicBeliever           from './music-believer'
import musicHotelCalifornia    from './music-hotel-california'
import musicSweetChildOMine    from './music-sweet-child-o-mine'
import musicHelloAdele         from './music-hello-adele'
import musicUnderTheBridge     from './music-under-the-bridge'
import musicRollingInTheDeep   from './music-rolling-in-the-deep'
import videoKurzgesagtNihilism from './video-kurzgesagt-nihilism'
import musicCalifornication    from './music-californication'

const ALL: Array<StaticLesson | null> = [
  musicHappy,
  musicShakeItOff,
  musicHallOfFame,
  musicFixYou,
  musicStressedOut,
  videoKurzgesagtEgg,
  videoVeritasiumParallel,
  musicByTheWay,
  musicSomewhereRainbow,
  musicRoar,
  musicSomeoneLikeYou,
  musicBeliever,
  musicHotelCalifornia,
  musicSweetChildOMine,
  musicHelloAdele,
  musicUnderTheBridge,
  musicRollingInTheDeep,
  videoKurzgesagtNihilism,
  musicCalifornication,
]

export const STATIC_LESSONS: Record<string, StaticLesson> = Object.fromEntries(
  ALL.filter((l): l is StaticLesson => l !== null).map((l) => [l.feed_item_id, l]),
)

export function getStaticLesson(id: string): StaticLesson | null {
  return STATIC_LESSONS[id] ?? null
}
