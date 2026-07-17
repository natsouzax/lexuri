import { parseIsoDuration } from '../parser/time'

export async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { cache: 'no-store' },
    )
    if (!res.ok) return 'Untitled'
    const data = (await res.json()) as { title?: string }
    return data.title ?? 'Untitled'
  } catch {
    return 'Untitled'
  }
}

// Video duration in seconds via the Data API (0 when unavailable).
export async function getVideoDurationSeconds(videoId: string): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set.')

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`,
  )
  const data = await res.json() as {
    items?: Array<{ contentDetails: { duration: string } }>
  }
  return parseIsoDuration(data.items?.[0]?.contentDetails?.duration ?? 'PT0S')
}
