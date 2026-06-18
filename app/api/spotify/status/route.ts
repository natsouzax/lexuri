import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false })

  const admin = getAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('spotify_refresh_token')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({ connected: !!data?.spotify_refresh_token })
}
