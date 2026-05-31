import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { price_id: string }
    if (!body.price_id) {
      return NextResponse.json({ error: 'price_id is required' }, { status: 400 })
    }

    const stripe = getStripe()
    const admin  = getAdminClient()

    // Reuse existing Stripe customer if available
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = sub?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: body.price_id, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?success=true`,
      cancel_url:  `${appUrl}/pricing?canceled=true`,
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[create-checkout-session]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
