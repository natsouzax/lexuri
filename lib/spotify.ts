import { getAdminClient } from './supabase'

// ── Client-credentials token (for public metadata) ───────────────────────────

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

// ── User OAuth token (for lyrics + personalized feed) ────────────────────────

export async function getUserAccessToken(userId: string): Promise<string | null> {
  const admin = getAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('spotify_access_token, spotify_refresh_token, spotify_token_expiry')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.spotify_refresh_token) return null

  // Return cached access token if still valid (with 60s buffer)
  if (
    profile.spotify_access_token &&
    profile.spotify_token_expiry &&
    new Date(profile.spotify_token_expiry).getTime() - 60_000 > Date.now()
  ) {
    return profile.spotify_access_token
  }

  // Refresh the token
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: profile.spotify_refresh_token,
    }),
  })

  if (!res.ok) return null

  const tokens = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await admin.from('profiles').update({
    spotify_access_token: tokens.access_token,
    spotify_token_expiry: expiry,
    ...(tokens.refresh_token ? { spotify_refresh_token: tokens.refresh_token } : {}),
  }).eq('id', userId)

  return tokens.access_token
}

// ── Spotify internal lyrics endpoint (Musixmatch-backed, line-synced) ────────

export interface SpotifyLyricsLine {
  startTimeMs: number
  words: string
  endTimeMs: number
}

export async function getSpotifyLyrics(
  trackId: string,
  userAccessToken: string,
): Promise<SpotifyLyricsLine[] | null> {
  try {
    const res = await fetch(
      `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          'app-platform': 'WebPlayer',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      lyrics?: {
        syncType?: string
        lines?: Array<{ startTimeMs: string; words: string; endTimeMs: string }>
      }
    }

    const lines = data.lyrics?.lines
    if (!lines?.length) return null

    return lines.map((l) => ({
      startTimeMs: parseInt(l.startTimeMs, 10),
      words: l.words,
      endTimeMs: parseInt(l.endTimeMs, 10),
    }))
  } catch {
    return null
  }
}

// ── Spotify track search (to get track ID from title+artist) ─────────────────

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

// ── Personalized feed tracks ──────────────────────────────────────────────────

export interface SpotifyTrackSummary {
  id: string
  title: string
  artist: string
  album: string
  album_art: string | null
  preview_url: string | null
  spotify_url: string
  duration_ms: number
  popularity: number
}

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

// ── Existing public helpers ───────────────────────────────────────────────────

export function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

export async function resolveSpotifyTrack(trackId: string): Promise<{ title: string; artist: string }> {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify track fetch error: ${res.status}`)
  const data = (await res.json()) as { name: string; artists: Array<{ name: string }> }
  return {
    title: data.name,
    artist: data.artists[0]?.name ?? '',
  }
}
