import type { Metadata } from 'next'
import { isBrazil } from '@/lib/geo'
import PlansPageContent from '@/components/marketing/PlansPageContent'

export const metadata: Metadata = {
  title: 'Plans — Lexuri',
  description: 'Lexuri is free to start. Go Premium to unlock unlimited content, advanced AI features, and faster progress. Use coupon LEARN for 2 weeks free.',
}

export default async function PlansPage() {
  const br = await isBrazil()

  const priceAmount = br ? 'R$29,90' : '$7'
  const pricePeriod = '/ month'
  const priceId = br
    ? (process.env.STRIPE_PRO_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')

  // Plano anual: R$249/ano (≈ R$20,75/mês, economize R$109,80 = ~3 meses grátis)
  //              $59/ano  (≈ $4,92/mês, save $25 = ~3,5 months free)
  const annualPriceAmount = br ? 'R$249' : '$59'
  const annualSavings = br ? 'R$109,80' : '$25'
  const annualPriceId = br
    ? (process.env.STRIPE_PRO_ANNUAL_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? '')

  return (
    <PlansPageContent
      priceAmount={priceAmount}
      pricePeriod={pricePeriod}
      priceId={priceId}
      annualPriceAmount={annualPriceAmount}
      annualSavings={annualSavings}
      annualPriceId={annualPriceId}
    />
  )
}
