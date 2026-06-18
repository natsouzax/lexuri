import type { Metadata } from 'next'
import { isBrazil } from '@/lib/geo'
import PlansPageContent from '@/components/marketing/PlansPageContent'

export const metadata: Metadata = {
  title: 'Plans — Lexuri',
  description: 'Lexuri is free to start. Go Premium to unlock unlimited content, advanced AI features, and faster progress. Use coupon LEARN for 2 weeks free.',
}

export default async function PlansPage() {
  const br = await isBrazil()

  const priceAmount = br ? 'R$25' : '$5'
  const pricePeriod = '/ month'
  const priceId = br
    ? (process.env.STRIPE_PRO_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')

  // Plano anual pré-pago — defina os valores anuais desejados e cole os price IDs do Stripe no .env.local
  const annualPriceAmount = br ? 'R$240' : '$48'
  const annualSavings = br ? 'R$60' : '$12'
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
