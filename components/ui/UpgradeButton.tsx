'use client'

import { useState } from 'react'

interface Props {
  priceId: string
  label?: string
  className?: string
}

export default function UpgradeButton({ priceId, label = 'Get Pro →', className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ price_id: priceId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}
    </div>
  )
}
