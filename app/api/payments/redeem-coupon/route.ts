import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { code?: string }
  const code = (body.code ?? '').trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 })

  const admin = getAdminClient()

  // Load coupon from DB
  const { data: coupon } = await admin
    .from('coupon_codes')
    .select('id, description, grants_plan_key, grants_days, max_uses, uses_count, active, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 400 })
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 })
  }
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'This coupon has already been fully redeemed.' }, { status: 400 })
  }

  // Prevent this user from redeeming the same coupon twice
  const { data: existing } = await admin
    .from('coupon_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('coupon_code', code)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already redeemed this coupon.' }, { status: 400 })
  }

  // Calculate new premium_until — extend from current expiry if still active
  const { data: profile } = await admin
    .from('profiles')
    .select('premium_until')
    .eq('id', user.id)
    .maybeSingle()

  const base =
    profile?.premium_until && new Date(profile.premium_until) > new Date()
      ? new Date(profile.premium_until)
      : new Date()

  const premiumUntil = new Date(base)
  const days = coupon.grants_days ?? 36500 // null grants_days = effectively permanent (100 years)
  premiumUntil.setDate(premiumUntil.getDate() + days)

  const planKey = coupon.grants_plan_key ?? 'pro'

  // Upsert profile: creates the row if it doesn't exist yet (trigger may not have run)
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, premium_until: premiumUntil.toISOString(), plan_key: planKey },
      { onConflict: 'id' },
    )

  if (profileError) {
    console.error('[redeem-coupon] profile upsert failed:', profileError)
    return NextResponse.json({ error: 'Failed to activate Premium. Please try again.' }, { status: 500 })
  }

  // Record redemption — unique constraint (user_id, coupon_code) is a safety net
  const { error: redemptionError } = await admin
    .from('coupon_redemptions')
    .insert({ user_id: user.id, coupon_code: code })

  if (redemptionError) {
    console.error('[redeem-coupon] redemption insert failed:', redemptionError)
    return NextResponse.json({ error: 'Failed to record coupon redemption.' }, { status: 500 })
  }

  // Increment uses_count with an atomic guard against max_uses races
  await admin
    .from('coupon_codes')
    .update({ uses_count: coupon.uses_count + 1 })
    .eq('id', coupon.id)
    .or(`max_uses.is.null,uses_count.lt.${coupon.max_uses ?? 0}`)

  const label = coupon.description || `${days} days of Premium`

  return NextResponse.json({
    success: true,
    label,
    premium_until: premiumUntil.toISOString(),
    plan_key: planKey,
  })
}
