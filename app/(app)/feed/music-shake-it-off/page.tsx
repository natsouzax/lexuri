'use client'

import LessonView from '@/components/LessonView'
import staticData from '@/data/featured-lessons/music-shake-it-off'
import { getFeedItem } from '@/lib/feed'
import type { LessonData } from '@/components/LessonView'

const item = getFeedItem('music-shake-it-off')
const initialLesson: LessonData | null = staticData ? {
  video_id: staticData.video_id,
  title: item?.title ?? '',
  transcript: staticData.transcript,
  segments: staticData.segments,
  original_text: staticData.transcript,
  chunks: staticData.chunks,
} : null

export default function Page() {
  return <LessonView feedItemId="music-shake-it-off" initialLesson={initialLesson} />
}
