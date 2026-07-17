import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const level = searchParams.get('level')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = parseInt(searchParams.get('limit') ?? '100')
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let query = supabase
    .from('feed_items')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (level) {
    query = query.eq('level', level)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
