import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

function buildRedirectUri(request: Request): string {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}/api/spotify/callback`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const returnTo = state ? decodeURIComponent(state) : '/music'

  if (error || !code) {
    return NextResponse.redirect(new URL(`${returnTo}?spotify_error=1`, url.origin))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', url.origin))

  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: buildRedirectUri(request),
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(`${returnTo}?spotify_error=1`, url.origin))
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const admin = getAdminClient()
  await admin.from('profiles').update({
    spotify_refresh_token: tokens.refresh_token,
    spotify_access_token: tokens.access_token,
    spotify_token_expiry: expiry,
  }).eq('id', user.id)

  return NextResponse.redirect(new URL(`${returnTo}?spotify_connected=1`, url.origin))
}
