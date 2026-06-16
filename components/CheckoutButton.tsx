'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  priceId: string
  label?: string
  style?: React.CSSProperties
}

export default function CheckoutButton({ priceId, label = 'Assinar Premium', style }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'block',
        width: '100%',
        background: 'var(--clay)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.9rem',
        padding: '13px 20px',
        borderRadius: 12,
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        textAlign: 'center',
        marginTop: 28,
        ...style,
      }}
    >
      {loading ? 'Redirecionando...' : label}
    </button>
  )
}
