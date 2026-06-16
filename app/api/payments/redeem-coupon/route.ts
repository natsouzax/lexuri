import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

const VALID_COUPONS: Record<string, { months: number; label: string }> = {
  LEARN: { months: 1, label: '1 month of Premium' },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { code?: string }
  const code = (body.code ?? '').trim().toUpperCase()

  const coupon = VALID_COUPONS[code]
  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Prevent double redemption
  const { data: existing } = await admin
    .from('coupon_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('coupon_code', code)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already redeemed this coupon.' }, { status: 400 })
  }

  // Calculate new premium_until (extend if user already has active coupon period)
  const { data: profile } = await admin
    .from('profiles')
    .select('premium_until')
    .eq('id', user.id)
    .maybeSingle()

  const base = profile?.premium_until && new Date(profile.premium_until) > new Date()
    ? new Date(profile.premium_until)
    : new Date()

  const premiumUntil = new Date(base)
  premiumUntil.setMonth(premiumUntil.getMonth() + coupon.months)

  // Record redemption and update profile atomically
  const [redemptionResult] = await Promise.all([
    admin.from('coupon_redemptions').insert({
      user_id: user.id,
      coupon_code: code,
    }),
    admin
      .from('profiles')
      .update({ premium_until: premiumUntil.toISOString() })
      .eq('id', user.id),
  ])

  if (redemptionResult.error) {
    return NextResponse.json({ error: 'Failed to redeem coupon.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    label: coupon.label,
    premium_until: premiumUntil.toISOString(),
  })
}
