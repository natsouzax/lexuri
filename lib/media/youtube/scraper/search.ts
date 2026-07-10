import { watchUrl } from '../url'

const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
]

// Search YouTube for a video by artist + title.
// Primary: YouTube Data API v3 (requires YOUTUBE_API_KEY).
// Fallback: public Invidious instances (no key needed).
export async function searchYouTubeVideo(artist: string, title: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey) {
    try {
      const q = encodeURIComponent(`${artist} ${title} official video`)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=3&key=${apiKey}`,
        { signal: AbortSignal.timeout(8000) },
      )
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ id: { videoId: string } }> }
        const videoId = data.items?.[0]?.id?.videoId
        if (videoId) return watchUrl(videoId)
      }
    } catch { /* fall through to Invidious */ }
  }

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const q = encodeURIComponent(`${artist} ${title}`)
      const res = await fetch(
        `${instance}/api/v1/search?q=${q}&type=video&fields=videoId`,
        { signal: AbortSignal.timeout(5000) },
      )
      if (res.ok) {
        const data = (await res.json()) as Array<{ videoId?: string }>
        const videoId = Array.isArray(data) ? data[0]?.videoId : undefined
        if (videoId) return watchUrl(videoId)
      }
    } catch { /* try next instance */ }
  }

  return null
}
