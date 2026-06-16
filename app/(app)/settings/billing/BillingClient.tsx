'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Subscription {
  status: string
  price_id: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
}

interface Props {
  subscription: Subscription | null
  premiumUntil: string | null
  success: boolean
  canceled: boolean
  prefillCoupon: string
  proPriceId: string
  priceLabel: string
}

export default function BillingClient({ subscription, premiumUntil, success, canceled, prefillCoupon, proPriceId, priceLabel }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [couponCode, setCouponCode] = useState(prefillCoupon.toUpperCase())
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')
  const [newPremiumUntil, setNewPremiumUntil] = useState<string | null>(null)

  const isStripeActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const effectivePremiumUntil = newPremiumUntil ?? premiumUntil
  const isCouponActive = effectivePremiumUntil && new Date(effectivePremiumUntil) > new Date()
  const isPremium = isStripeActive || isCouponActive

  async function openPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/payments/create-portal-session', { method: 'POST' })
    const data = await res.json() as { url?: string }
    if (data.url) window.location.href = data.url
    else setPortalLoading(false)
  }

  async function redeemCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    setCouponSuccess('')
    try {
      const res = await fetch('/api/payments/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      })
      const data = await res.json() as { success?: boolean; label?: string; premium_until?: string; error?: string }
      if (!res.ok || !data.success) {
        setCouponError(data.error ?? 'Failed to redeem coupon.')
      } else {
        setCouponSuccess(`${data.label} activated! Enjoy your Premium access.`)
        setNewPremiumUntil(data.premium_until ?? null)
        setCouponCode('')
      }
    } catch {
      setCouponError('Something went wrong. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.8rem', marginBottom: 8, color: 'var(--ink)' }}>
        Billing & Plans
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        Manage your subscription and access.
      </p>

      {success && (
        <div className="alert-info" style={{ marginBottom: 20 }}>
          Subscription activated! Welcome to Premium.
        </div>
      )}
      {canceled && (
        <div className="alert-warn" style={{ marginBottom: 20 }}>
          Checkout was canceled. No charge was made.
        </div>
      )}
      {couponSuccess && (
        <div className="alert-info" style={{ marginBottom: 20 }}>
          {couponSuccess}
        </div>
      )}

      {/* ── Current plan status ── */}
      <div style={{ border: isPremium ? '2px solid var(--clay)' : '1px solid var(--line)', borderRadius: 18, padding: '24px 28px', background: isPremium ? 'rgba(200,111,74,0.04)' : '#fff', marginBottom: 20, position: 'relative' }}>
        {isPremium && (
          <span style={{ position: 'absolute', top: -12, left: 20, background: 'var(--clay)', color: '#fff', fontSize: '0.68rem', fontWeight: 900, padding: '3px 12px', borderRadius: 999, letterSpacing: '0.08em' }}>
            PREMIUM
          </span>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.2rem', marginBottom: 4 }}>
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </div>
            {isStripeActive && subscription?.current_period_end && (
              <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
                Renews on <strong>{new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            )}
            {isCouponActive && !isStripeActive && (
              <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
                Free access until <strong>{new Date(effectivePremiumUntil!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            )}
            {!isPremium && (
              <div style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 2 }}>
                5 YouTube imports/week · 30 flashcards · Basic review
              </div>
            )}
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.06em', background: isPremium ? 'rgba(200,111,74,0.15)' : 'var(--line)', color: isPremium ? 'var(--clay)' : 'var(--muted)', flexShrink: 0 }}>
            {isPremium ? 'Active' : 'Free'}
          </span>
        </div>

        {isStripeActive && (
          <button onClick={openPortal} disabled={portalLoading} className="btn-secondary" style={{ marginTop: 20, width: '100%' }}>
            {portalLoading ? 'Loading…' : 'Manage subscription'}
          </button>
        )}

        {isCouponActive && !isStripeActive && proPriceId && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 12 }}>
              Want to continue after your free period? Subscribe for {priceLabel}.
            </p>
            <a href={`/api/payments/create-checkout-session`} onClick={async (e) => { e.preventDefault(); const r = await fetch('/api/payments/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_id: proPriceId }) }); const d = await r.json() as { url?: string }; if (d.url) window.location.href = d.url }} className="btn-secondary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Subscribe — {priceLabel}
            </a>
          </div>
        )}
      </div>

      {/* ── Coupon redemption ── */}
      {!isStripeActive && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: '24px 28px', background: '#fff', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1rem', marginBottom: 6 }}>
            Redeem a coupon
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
            Have a coupon code? Enter it below to unlock Premium access instantly.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && redeemCoupon()}
              placeholder="e.g. LEARN"
              disabled={couponLoading}
              style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.04em', outline: 'none', color: 'var(--ink)', background: '#fff' }}
            />
            <button
              onClick={redeemCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap', padding: '11px 20px' }}
            >
              {couponLoading ? 'Applying…' : 'Apply'}
            </button>
          </div>

          {couponError && (
            <p style={{ marginTop: 10, fontSize: '0.83rem', color: '#b91c1c', fontWeight: 700 }}>{couponError}</p>
          )}
        </div>
      )}

      {/* ── Upgrade CTA (free users without coupon) ── */}
      {!isPremium && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: '24px 28px', background: '#fff' }}>
          <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1rem', marginBottom: 6 }}>
            Go Premium
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
            Unlimited content, advanced AI, and detailed progress tracking — all for {priceLabel}.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {proPriceId ? (
              <button
                onClick={async () => {
                  const r = await fetch('/api/payments/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_id: proPriceId }) })
                  const d = await r.json() as { url?: string }
                  if (d.url) window.location.href = d.url
                }}
                className="btn-primary"
              >
                Upgrade to Premium — {priceLabel}
              </button>
            ) : null}
            <Link href="/plans" className="btn-secondary">See what&apos;s included</Link>
          </div>
        </div>
      )}
    </div>
  )
}
