// YouTube module types. TranscriptSegment/VideoData are app-wide shared types
// (used by chunks, feed, client pages) — the canonical definition stays in
// lib/types.ts and is re-exported here for module cohesion.

export type { TranscriptSegment, VideoData } from '@/lib/types'

import type { TranscriptSegment, VideoData } from '@/lib/types'

export interface FastTranscriptResult {
  data: VideoData
  videoId: string
  mergedSegments: TranscriptSegment[]
  needsRepair: boolean
}

/** Result of the edge page-fetch scraper (includes caption-track metadata). */
export interface EdgePageCaptions {
  segments: TranscriptSegment[]
  isASR: boolean
  hasMusicalSymbol: boolean
}
