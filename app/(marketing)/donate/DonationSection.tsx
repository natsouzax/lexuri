'use client'

import { useState } from 'react'

const ONE_TIME_PRESETS = [1, 5, 10, 100]

export default function DonationSection() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [loadingOneTime, setLoadingOneTime] = useState(false)
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [error, setError] = useState('')

  const effectiveAmount = customAmount !== '' ? parseFloat(customAmount) : selectedPreset
  const anyLoading = loadingOneTime || loadingMonthly

  async function handleOneTimeDonate() {
    const raw = customAmount !== '' ? parseFloat(customAmount) : selectedPreset
    if (!raw || raw < 1 || !isFinite(raw)) {
      setError('Please enter a valid amount (minimum $1 USD).')
      return
    }
    const amount = Math.round(raw)
    setLoadingOneTime(true)
    setError('')
    try {
      const res = await fetch('/api/payments/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'one-time', amount }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(String(e))
      setLoadingOneTime(false)
    }
  }

  async function handleMonthlyDonate() {
    setLoadingMonthly(true)
    setError('')
    try {
      const res = await fetch('/api/payments/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'monthly' }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(String(e))
      setLoadingMonthly(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* ── One-time ── */}
      <div style={{
        border: '1px solid var(--line)',
        borderRadius: 20,
        padding: '28px 32px',
        background: 'var(--paper)',
      }}>
        <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.2rem', marginBottom: 6 }}>
          Donate any amount
        </div>
        <p style={{ fontSize: '0.87rem', color: 'var(--muted)', marginBottom: 22, lineHeight: 1.65 }}>
          Any amount helps — it all goes toward keeping Lexuri free, covering infrastructure costs, and
          speeding up development. One-time, no account required.
        </p>

        {/* Preset pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {ONE_TIME_PRESETS.map((p) => {
            const active = selectedPreset === p && customAmount === ''
            return (
              <button
                key={p}
                onClick={() => { setSelectedPreset(p); setCustomAmount('') }}
                disabled={anyLoading}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: `1.5px solid ${active ? 'var(--clay)' : 'var(--line)'}`,
                  background: active ? 'rgba(200,111,74,0.08)' : 'transparent',
                  fontFamily: 'Fraunces,Georgia,serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: active ? 'var(--clay)' : 'inherit',
                  cursor: anyLoading ? 'wait' : 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                ${p}
              </button>
            )
          })}
        </div>

        {/* Custom amount */}
        <label
          htmlFor="custom-amount"
          style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          Amount (USD)
        </label>
        <div style={{ position: 'relative', marginBottom: 22 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'Fraunces,Georgia,serif', fontWeight: 700, color: 'var(--muted)', pointerEvents: 'none',
          }}>
            $
          </span>
          <input
            id="custom-amount"
            type="number"
            min="1"
            step="1"
            placeholder="Enter your own amount"
            value={customAmount}
            disabled={anyLoading}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
            style={{
              width: '100%',
              padding: '11px 14px 11px 28px',
              border: `1.5px solid ${customAmount ? 'var(--clay)' : 'var(--line)'}`,
              borderRadius: 10,
              fontSize: '0.95rem',
              outline: 'none',
              background: 'var(--paper)',
              color: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={handleOneTimeDonate}
          disabled={anyLoading || !effectiveAmount}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'Fraunces,Georgia,serif',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: loadingOneTime ? 'wait' : 'pointer',
            opacity: anyLoading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loadingOneTime
            ? 'Redirecting to checkout…'
            : effectiveAmount
              ? `Donate now — $${Math.round(effectiveAmount)} USD`
              : 'Donate now'}
        </button>
      </div>

      {/* ── Monthly ── */}
      <div style={{
        border: '2px solid var(--clay)',
        borderRadius: 20,
        padding: '28px 32px',
        background: 'rgba(200,111,74,0.04)',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: -13, left: 24,
          background: 'var(--clay)', color: '#fff',
          fontSize: '0.72rem', fontWeight: 700,
          padding: '4px 14px', borderRadius: 999, letterSpacing: '0.06em',
        }}>
          BEST SUPPORT
        </span>

        <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.2rem', marginBottom: 8 }}>
          Monthly supporter plan
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '2.1rem', color: 'var(--clay)' }}>$5</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>USD / month</span>
        </div>

        <p style={{ fontSize: '0.87rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
          The best way to back Lexuri for the long haul. A predictable monthly contribution means
          faster development and a more stable free tier for everyone.
        </p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            'Keeps the core app free for every learner',
            'Funds new features: podcasts, mobile app, reading mode',
            'Covers server hosting and AI API costs',
            'Your name in the supporters list',
          ].map((benefit) => (
            <li key={benefit} style={{ fontSize: '0.87rem', color: 'var(--muted)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--clay)', fontWeight: 900, lineHeight: 1.5 }}>✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        <button
          onClick={handleMonthlyDonate}
          disabled={anyLoading}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--clay)',
            color: '#fff',
            fontFamily: 'Fraunces,Georgia,serif',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: loadingMonthly ? 'wait' : 'pointer',
            opacity: anyLoading ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loadingMonthly ? 'Redirecting to checkout…' : 'Support monthly — $5 USD/mo'}
        </button>

        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
          Billed monthly in USD. Cancel anytime — no lock-in.
        </p>
      </div>

    </div>
  )
}
