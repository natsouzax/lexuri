import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { type: 'one-time' | 'monthly'; amount?: number }
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (body.type === 'monthly') {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Lexuri Monthly Supporter',
                description: 'Monthly support for Lexuri. Cancel anytime from your email receipt.',
              },
              unit_amount: 500,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/donate?donated=true`,
        cancel_url: `${appUrl}/donate`,
      })
      return NextResponse.json({ url: session.url })
    }

    // One-time donation — any positive integer dollar amount
    const amount = body.amount
    if (!amount || !Number.isFinite(amount) || amount < 1 || amount > 10000) {
      return NextResponse.json(
        { error: 'Please enter a valid amount between $1 and $10,000 USD.' },
        { status: 400 },
      )
    }
    const cents = Math.round(amount) * 100

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lexuri Donation — $${Math.round(amount)} USD`,
              description: 'Thank you for supporting Lexuri. Every dollar keeps the app free and improving.',
            },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/donate?donated=true`,
      cancel_url: `${appUrl}/donate`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
