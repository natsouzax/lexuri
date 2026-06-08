import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

const ALLOWED_AMOUNTS = [5, 15, 50] as const
type DonationAmount = (typeof ALLOWED_AMOUNTS)[number]

const TIER_LABELS: Record<DonationAmount, string> = {
  5:  'Coffee supporter',
  15: 'Monthly supporter',
  50: 'Patron',
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amount: number }
    const amount = body.amount as DonationAmount

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json({ error: 'Invalid donation amount.' }, { status: 400 })
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lexuri Donation — ${TIER_LABELS[amount]}`,
              description: 'Thank you for supporting Lexuri. Every dollar keeps the app free and improving.',
            },
            unit_amount: amount * 100,
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
