import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  await admin.from('profiles').update({
    spotify_refresh_token: null,
    spotify_access_token: null,
    spotify_token_expiry: null,
  }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
