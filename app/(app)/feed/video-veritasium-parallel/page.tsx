'use client'

import LessonView from '@/components/LessonView'
import staticData from '@/data/featured-lessons/video-veritasium-parallel'
import { getFeedItem } from '@/lib/feed'
import type { LessonData } from '@/components/LessonView'

const item = getFeedItem('video-veritasium-parallel')
const initialLesson: LessonData | null = staticData ? {
  video_id: staticData.video_id,
  title: item?.title ?? '',
  transcript: staticData.transcript,
  segments: staticData.segments,
  original_text: staticData.transcript,
  chunks: staticData.chunks,
} : null

export default function Page() {
  return <LessonView feedItemId="video-veritasium-parallel" initialLesson={initialLesson} />
}
