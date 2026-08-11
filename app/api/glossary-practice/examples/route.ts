import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('glossary_examples')
      .select('id, takeaway_id, target_expression, question, answer, original_answer, feedback, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
