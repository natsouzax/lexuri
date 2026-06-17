import type { Metadata } from 'next'
import { isBrazil } from '@/lib/geo'
import PlansPageContent from '@/components/marketing/PlansPageContent'

export const metadata: Metadata = {
  title: 'Plans — Lexuri',
  description: 'Lexuri is free to start. Go Premium to unlock unlimited content, advanced AI features, and faster progress. Use coupon LEARN for 1 month free.',
}

export default async function PlansPage() {
  const br = await isBrazil()
  const priceAmount = br ? 'R$25' : '$5'
  const pricePeriod = br ? '/ mês' : '/ month'
  const priceId = br
    ? (process.env.STRIPE_PRO_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')

  return (
    <PlansPageContent
      priceAmount={priceAmount}
      pricePeriod={pricePeriod}
      priceId={priceId}
    />
  )
}
