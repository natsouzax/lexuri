import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserAccessToken, getPersonalizedTracks } from '@/lib/spotify'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getUserAccessToken(user.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'Spotify not connected', needs_auth: true }, { status: 403 })
  }

  try {
    const tracks = await getPersonalizedTracks(accessToken)
    return NextResponse.json({ tracks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
