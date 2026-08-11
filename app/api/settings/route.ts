import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as {
      fullName?: string
      marketingConsent?: boolean
    }
    const fullName = String(body.fullName ?? '').trim()
    if (fullName.length < 2 || fullName.length > 100 || typeof body.marketingConsent !== 'boolean') {
      return NextResponse.json({ error: 'Invalid profile settings.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error: profileError } = await supabase.from('profiles').update({
      full_name: fullName,
      marketing_consent: body.marketingConsent,
      marketing_consent_updated_at: now,
      updated_at: now,
    }).eq('id', user.id)
    if (profileError) throw profileError

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: fullName,
        marketing_consent: body.marketingConsent,
      },
    })
    if (authError) throw authError

    return NextResponse.json({
      fullName,
      marketingConsent: body.marketingConsent,
      marketingConsentUpdatedAt: now,
    })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
