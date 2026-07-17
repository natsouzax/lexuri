import { getAdminClient } from '@/lib/supabase'
import { SpotifyNotConfiguredError } from '../errors'

// ── Client-credentials token (for public metadata) ───────────────────────────

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new SpotifyNotConfiguredError()

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
