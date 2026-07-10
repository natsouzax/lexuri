import { getSpotifyToken } from './auth'
import type { SpotifyTrack } from '../types'

// Track identification — the Spotify module resolves *what* the music is;
// lyrics live in the Lyrics module.

// accessToken lets the caller pass a connected user's OAuth token instead of
// the app's client-credentials token. Spotify requires the app owner to have
// an active Premium subscription for client-credentials catalog access — a
// per-user OAuth token is scoped to that user's own account and isn't
// subject to the same restriction, so it's preferred whenever available.
export async function resolveSpotifyTrack(trackId: string, accessToken?: string): Promise<SpotifyTrack> {
  const token = accessToken ?? await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Spotify track fetch error ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as { name: string; artists: Array<{ name: string }> }
  return {
    title: data.name,
    artist: data.artists[0]?.name ?? '',
  }
}

// Last-resort fallback needing no token at all — used when both the user's
// OAuth token (if any) and the app's client-credentials token fail. Only
// returns a title (Spotify's oEmbed response has no artist field), so lyrics
// matching quality is degraded, but it beats a hard failure.
export async function fetchSpotifyTrackTitleViaOEmbed(trackUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string }
    return data.title ?? null
  } catch {
    return null
  }
}

export async function searchSpotifyTrackId(
  artist: string,
  title: string,
  userAccessToken: string,
): Promise<string | null> {
  try {
    const q = encodeURIComponent(`track:${title} artist:${artist}`)
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${userAccessToken}` },
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { tracks?: { items?: Array<{ id: string }> } }
    return data.tracks?.items?.[0]?.id ?? null
  } catch {
    return null
  }
}
