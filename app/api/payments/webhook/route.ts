import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase'

// Next.js must receive the raw body for Stripe signature verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Invalid signature:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session    = event.data.object as Stripe.Checkout.Session
        const userId     = session.metadata?.user_id
        const customerId = session.customer as string
        const subId      = session.subscription as string
        if (!userId || !subId) break

        const subscription = await getStripe().subscriptions.retrieve(subId)
        const periodEnd    = (subscription as unknown as { current_period_end: number }).current_period_end
        await admin.from('subscriptions').upsert({
          user_id:                userId,
          stripe_customer_id:     customerId,
          stripe_subscription_id: subId,
          price_id:               subscription.items.data[0].price.id,
          status:                 subscription.status,
          current_period_end:     new Date(periodEnd * 1000).toISOString(),
          updated_at:             new Date().toISOString(),
        }, { onConflict: 'user_id' })

        await admin.from('analytics_events').insert({
          user_id:    userId,
          event_name: 'payment_complete',
          payload:    { stripe_subscription_id: subId, price_id: subscription.items.data[0].price.id },
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const periodEnd  = (sub as unknown as { current_period_end: number }).current_period_end

        await admin.from('subscriptions').update({
          status:             sub.status,
          price_id:           sub.items.data[0].price.id,
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          updated_at:         new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await admin.from('subscriptions').update({
          status:     'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
