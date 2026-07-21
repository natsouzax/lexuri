import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

// GET: progresso de todas as músicas do usuário + nível de estudo.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: progress }, { data: profile }] = await Promise.all([
      supabase.from('song_progress').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('study_level').eq('id', user.id).maybeSingle(),
    ])

    return NextResponse.json({
      progress: progress ?? [],
      study_level: profile?.study_level ?? null,
    })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}

// POST { song_id, action: 'listened' | 'day1' | 'day2' | 'day3' }
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { song_id, action } = (await request.json()) as {
      song_id: string
      action: 'listened' | 'day1' | 'day2' | 'day3'
    }
    if (!song_id || !['listened', 'day1', 'day2', 'day3'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const patch: Record<string, string> = { user_id: user.id, song_id }
    if (action === 'listened') patch.listened_at = now
    if (action === 'day1') patch.day1_done_at = now
    if (action === 'day2') patch.day2_done_at = now
    if (action === 'day3') patch.day3_done_at = now

    const { data, error } = await supabase
      .from('song_progress')
      .upsert(patch, { onConflict: 'user_id,song_id' })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
