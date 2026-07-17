// Cache layer decoupled from LyricsService — swap InMemoryLyricsCache for a
// Redis/Supabase implementation without touching the service.

import type { LyricsQuery, NormalizedLyrics } from './types'

export interface LyricsCache {
  get(key: string): Promise<NormalizedLyrics | null>
  set(key: string, value: NormalizedLyrics): Promise<void>
}

export function lyricsCacheKey(query: LyricsQuery): string {
  const norm = (s: string) => s.trim().toLowerCase()
  return [
    norm(query.artist),
    norm(query.title),
    query.spotifyTrackId ?? '',
    query.youtubeVideoId ?? '',
  ].join('|')
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const DEFAULT_MAX_ENTRIES = 500

export class InMemoryLyricsCache implements LyricsCache {
  private store = new Map<string, { value: NormalizedLyrics; expiresAt: number }>()

  constructor(
    private readonly ttlMs = DEFAULT_TTL_MS,
    private readonly maxEntries = DEFAULT_MAX_ENTRIES,
  ) {}

  async get(key: string): Promise<NormalizedLyrics | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: NormalizedLyrics): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}
