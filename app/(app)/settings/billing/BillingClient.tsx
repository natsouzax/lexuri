'use client'

import { useState } from 'react'
import UpgradeButton from '@/components/ui/UpgradeButton'

interface Subscription {
  status: string
  price_id: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
}

interface Props {
  subscription: Subscription | null
  success: boolean
  canceled: boolean
  proPriceId: string
}

export default function BillingClient({ subscription, success, canceled, proPriceId }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/payments/create-portal-session', { method: 'POST' })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) window.location.href = data.url
    else setPortalLoading(false)
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Billing</h1>

      {success && (
        <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#155724' }}>
          Subscription activated! Welcome to Pro.
        </div>
      )}
      {canceled && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#856404' }}>
          Checkout was canceled. No charge was made.
        </div>
      )}

      {isActive ? (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Pro Plan</div>
              <div style={{ color: '#555', fontSize: '0.85rem' }}>
                Status: <strong style={{ color: '#198754' }}>{subscription?.status}</strong>
              </div>
            </div>
            <span style={{ background: '#198754', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem' }}>
              Active
            </span>
          </div>

          {subscription?.current_period_end && (
            <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: 20 }}>
              Renews on{' '}
              <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong>
            </div>
          )}

          <button
            onClick={openPortal}
            disabled={portalLoading}
            style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', opacity: portalLoading ? 0.7 : 1 }}
          >
            {portalLoading ? 'Loading…' : 'Manage subscription'}
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Free Plan</div>
          <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: 20 }}>
            Upgrade to Pro for unlimited videos, flashcards, and priority AI.
          </p>
          {proPriceId ? (
            <UpgradeButton priceId={proPriceId} label="Upgrade to Pro — $9/mo" className="btn-mkt-primary" />
          ) : (
            <p style={{ color: '#888', fontSize: '0.85rem' }}>
              Stripe not configured. Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID to enable payments.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
