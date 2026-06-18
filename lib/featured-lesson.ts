import type { TranscriptSegment, ChunkItem } from './types'

export interface StaticLesson {
  feed_item_id: string
  video_id: string
  transcript: string
  segments: TranscriptSegment[]
  chunks: ChunkItem[]
  generated_at: string
}
