'use client'

import { useState } from 'react'

interface Tier {
  amount: number
  label: string
  desc: string
}

export default function SupportTierList({ supporters }: { supporters: Tier[] }) {
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handleDonate(amount: number) {
    setLoading(amount)
    setError('')
    try {
      const res = await fetch('/api/payments/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(String(e))
      setLoading(null)
    }
  }

  return (
    <>
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {supporters.map(({ amount, label, desc }) => (
          <button
            key={label}
            onClick={() => handleDonate(amount)}
            disabled={loading !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: `1px solid ${loading === amount ? 'var(--clay)' : 'var(--line)'}`,
              borderRadius: 16,
              padding: '20px 28px',
              background: loading === amount ? 'rgba(200,111,74,0.06)' : 'var(--paper)',
              textAlign: 'left',
              color: 'inherit',
              gap: 16,
              cursor: loading !== null ? 'wait' : 'pointer',
              width: '100%',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: loading === amount ? 'var(--shadow-md)' : undefined,
            }}
            onMouseEnter={(e) => {
              if (loading !== null) return
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clay)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              if (loading !== null) return
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            <div>
              <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.1rem', color: 'var(--clay)' }}>
                ${amount}
              </div>
              {loading === amount
                ? <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Redirecting…</span>
                : <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '6px 16px', borderRadius: 999, background: 'var(--clay)', color: '#fff' }}>Donate →</span>
              }
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
