import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import BillingClient from './BillingClient'
import { isBrazil } from '@/lib/geo'

export const metadata = { title: 'Billing & Plans' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; coupon?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings/billing')

  const [{ data: subscription }, { data: profile }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, price_id, current_period_end, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('premium_until')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const [params, br] = await Promise.all([searchParams, isBrazil()])

  const proPriceId = br
    ? (process.env.STRIPE_PRO_PRICE_ID_BRL ?? '')
    : (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '')
  const priceLabel = br ? 'R$25/mês' : '$5/mo'

  return (
    <BillingClient
      subscription={subscription ?? null}
      premiumUntil={profile?.premium_until ?? null}
      success={params.success === 'true'}
      canceled={params.canceled === 'true'}
      prefillCoupon={params.coupon ?? ''}
      proPriceId={proPriceId}
      priceLabel={priceLabel}
    />
  )
}
