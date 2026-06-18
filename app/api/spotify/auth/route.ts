import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

function buildRedirectUri(request: Request): string {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) return `${appUrl.replace(/\/$/, '')}/api/spotify/callback`
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}/api/spotify/callback`
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Spotify not configured' }, { status: 500 })

  const returnTo = new URL(request.url).searchParams.get('return_to') ?? '/music'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-top-read user-read-recently-played',
    redirect_uri: buildRedirectUri(request),
    state: encodeURIComponent(returnTo),
  })

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)
}
