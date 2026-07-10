import type { SpotifyTrackSummary } from '../types'

export async function getPersonalizedTracks(
  userAccessToken: string,
): Promise<SpotifyTrackSummary[]> {
  const [topRes, recentRes] = await Promise.allSettled([
    fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=30', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
      signal: AbortSignal.timeout(10000),
    }),
    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
      headers: { Authorization: `Bearer ${userAccessToken}` },
      signal: AbortSignal.timeout(10000),
    }),
  ])

  const tracks: SpotifyTrackSummary[] = []
  const seen = new Set<string>()

  function addTrack(raw: {
    id: string
    name: string
    artists: Array<{ name: string }>
    album: { name: string; images: Array<{ url: string }> }
    preview_url: string | null
    external_urls: { spotify: string }
    duration_ms: number
    popularity: number
  }) {
    if (seen.has(raw.id)) return
    seen.add(raw.id)
    tracks.push({
      id: raw.id,
      title: raw.name,
      artist: raw.artists.map((a) => a.name).join(', '),
      album: raw.album.name,
      album_art: raw.album.images[0]?.url ?? null,
      preview_url: raw.preview_url,
      spotify_url: raw.external_urls.spotify,
      duration_ms: raw.duration_ms,
      popularity: raw.popularity,
    })
  }

  if (topRes.status === 'fulfilled' && topRes.value.ok) {
    const data = (await topRes.value.json()) as { items: Parameters<typeof addTrack>[0][] }
    data.items.forEach(addTrack)
  }

  if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
    const data = (await recentRes.value.json()) as {
      items: Array<{ track: Parameters<typeof addTrack>[0] }>
    }
    data.items.forEach((i) => addTrack(i.track))
  }

  // If we have enough seeds, fetch recommendations
  const seedIds = tracks.slice(0, 5).map((t) => t.id).join(',')
  if (seedIds) {
    try {
      const recRes = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${seedIds}&limit=20`,
        {
          headers: { Authorization: `Bearer ${userAccessToken}` },
          signal: AbortSignal.timeout(10000),
        },
      )
      if (recRes.ok) {
        const recData = (await recRes.json()) as { tracks: Parameters<typeof addTrack>[0][] }
        recData.tracks.forEach(addTrack)
      }
    } catch { /* recommendations are optional */ }
  }

  return tracks
}
