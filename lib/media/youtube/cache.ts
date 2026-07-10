// Transcript cache decoupled from the transcript service — swap the Supabase
// implementation for Redis/memory without touching the service.

import { getAdminClient } from '@/lib/supabase'
import type { TranscriptSegment } from './types'

export interface CachedTranscript {
  transcript: string
  segments: TranscriptSegment[]
}

export interface TranscriptCache {
  get(videoId: string): Promise<CachedTranscript | null>
  set(videoId: string, segments: TranscriptSegment[]): Promise<void>
}

const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 days

export class SupabaseTranscriptCache implements TranscriptCache {
  async get(videoId: string): Promise<CachedTranscript | null> {
    try {
      const { data } = await getAdminClient()
        .from('youtube_transcript_cache')
        .select('transcript, segments')
        .eq('video_id', videoId)
        .gt('fetched_at', new Date(Date.now() - CACHE_TTL_MS).toISOString())
        .maybeSingle()

      if (!data) return null
      return { transcript: data.transcript, segments: data.segments as TranscriptSegment[] }
    } catch {
      return null
    }
  }

  async set(videoId: string, segments: TranscriptSegment[]): Promise<void> {
    const transcript = segments.map((s) => s.text).join('\n')
    await getAdminClient()
      .from('youtube_transcript_cache')
      .upsert({ video_id: videoId, transcript, segments, fetched_at: new Date().toISOString() })
  }
}

export const transcriptCache: TranscriptCache = new SupabaseTranscriptCache()
