import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { level: string }
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!validLevels.includes(body.level)) {
      return NextResponse.json({ error: 'Invalid level.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('onboarding')
      .upsert({ user_id: user.id, current_level: body.level }, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ level: body.level })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
