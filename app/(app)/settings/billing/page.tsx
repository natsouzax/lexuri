import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import BillingClient from './BillingClient'

export const metadata = { title: 'Billing' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings/billing')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, price_id, current_period_end, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  const params = await searchParams

  return (
    <BillingClient
      subscription={subscription ?? null}
      success={params.success === 'true'}
      canceled={params.canceled === 'true'}
      proPriceId={process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ''}
    />
  )
}
