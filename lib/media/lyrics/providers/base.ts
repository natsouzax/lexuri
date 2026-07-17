import { parseLrc } from '../parser'
import type { NormalizedLyrics } from '../types'

type LyricsInput = Omit<NormalizedLyrics, 'lines' | 'verified' | 'syncedLrc'> & {
  syncedLrc?: string | null
  verified?: boolean
}

// Builds the internal model from a provider's raw fields, deriving parsed
// timestamp lines from the LRC content. `verified` is decided by the service.
export function normalizedLyrics(input: LyricsInput): NormalizedLyrics {
  const syncedLrc = input.syncedLrc ?? null
  return {
    ...input,
    syncedLrc,
    lines: syncedLrc ? parseLrc(syncedLrc) : [],
    verified: input.verified ?? false,
  }
}
