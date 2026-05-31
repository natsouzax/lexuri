import { YoutubeTranscript } from 'youtube-transcript'
import type { TranscriptSegment, VideoData } from './types'

export function extractVideoId(url: string): string | null {
  const patterns = [/[?&]v=([^&#]+)/, /youtu\.be\/([^?&#]+)/, /\/shorts\/([^?&#]+)/]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )
    if (!res.ok) return 'Untitled'
    const data = (await res.json()) as { title?: string }
    return data.title ?? 'Untitled'
  } catch {
    return 'Untitled'
  }
}

export async function getTranscript(url: string): Promise<VideoData> {
  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID.')

  const [title, transcriptItems] = await Promise.all([
    getVideoTitle(videoId),
    // Prefer English captions; fall back to auto-detected language if English isn't available.
    YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))
      .catch(() => {
        throw new Error(
          'Could not fetch transcript. The video may not have captions available.',
        )
      }),
  ])

  const segments: TranscriptSegment[] = transcriptItems.map((item) => ({
    text: item.text,
    start: typeof item.offset === 'number' ? item.offset / 1000 : Number(item.offset) / 1000,
    duration: typeof item.duration === 'number' ? item.duration / 1000 : Number(item.duration) / 1000,
  }))

  const transcript = segments.map((s) => s.text).join(' ')

  return {
    video_id: videoId,
    title,
    transcript,
    segments,
    source: 'youtube_captions',
  }
}
