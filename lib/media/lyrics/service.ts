import { assessLyricsQuality } from './quality'
import { lyricsCacheKey, type LyricsCache } from './cache'
import type { LyricsProvider } from './providers/types'
import type { LyricsQuery, NormalizedLyrics } from './types'

// Runs the configured providers in order and returns the first result that
// passes the quality gate. Trusted providers (line-synced sources) skip the
// gate. When nothing passes, the best unverified text is returned with
// verified: false so the frontend can show the warning card/modal.
export class LyricsService {
  constructor(
    private readonly providers: LyricsProvider[],
    private readonly cache?: LyricsCache,
  ) {}

  async getLyrics(query: LyricsQuery): Promise<NormalizedLyrics> {
    const key = lyricsCacheKey(query)
    if (this.cache) {
      const hit = await this.cache.get(key)
      if (hit) return hit
    }

    let unverified: NormalizedLyrics | null = null

    for (const provider of this.providers) {
      let result: NormalizedLyrics | null = null
      try {
        result = await provider.fetch(query)
      } catch {
        continue
      }
      if (!result?.plainLyrics.trim()) continue

      if (provider.trusted) {
        return this.store(key, { ...result, verified: true })
      }

      const { quality } = assessLyricsQuality(result.plainLyrics, result.syncedLrc)
      if (quality !== 'unverified') {
        return this.store(key, { ...result, verified: true })
      }

      unverified ??= { ...result, verified: false }
    }

    return (
      unverified ?? {
        title: query.title,
        artist: query.artist,
        plainLyrics: '',
        syncedLrc: null,
        lines: [],
        source: 'none',
        verified: false,
      }
    )
  }

  private async store(key: string, result: NormalizedLyrics): Promise<NormalizedLyrics> {
    if (this.cache) {
      await this.cache.set(key, result).catch(() => {})
    }
    return result
  }
}
