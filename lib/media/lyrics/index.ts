// Lyrics Module — public API (server-side).
// Client components must import parser utilities from './parser' directly
// and types via `import type` from './types'.

export { LyricsService } from './service'
export { InMemoryLyricsCache, lyricsCacheKey, type LyricsCache } from './cache'
export { assessLyricsQuality, type LyricsQuality, type QualityResult } from './quality'
export { parseLrc, extractPlainFromLrc, buildLrc, type LrcLine } from './parser'
export { mergeLyricsSources, type LyricsSourceInput, type MergeResult, type MergedSegment } from './merge'
export type { LyricsQuery, NormalizedLyrics, TimedLine, LrcLibSearchHit } from './types'

export type { LyricsProvider } from './providers/types'
export { lrcLibProvider, lrcLibSearchProvider, fetchFromLrcLib, searchLrcLib } from './providers/lrclib'
export { lyricsOvhProvider, fetchFromLyricsOvh } from './providers/lyricsovh'
export { geniusProvider, fetchLyricsFromGenius, fetchLyricsFromGeniusUrl, searchGenius, type GeniusHit } from './providers/genius'
export { letrasProvider, scrapeLetras } from './providers/letras'
export { cifraClubProvider, scrapeCifraClub } from './providers/cifraclub'
export {
  createSpotifyLyricsProvider,
  fetchSpotifyTimedLines,
  timedLinesToLrc,
  type SpotifyTokenSource,
} from './providers/spotify-lyrics'
