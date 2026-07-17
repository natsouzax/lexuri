'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/" className="auth-logo-text">Lexuri</Link>
        </div>

        {sent ? (
          <div className="auth-success-block">
            <div className="auth-success-icon">✉</div>
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle">
              We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
            </p>
            <p className="auth-switch" style={{ marginTop: 24 }}>
              Didn&apos;t receive it?{' '}
              <button
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                onClick={() => { setSent(false); setError('') }}
              >
                Try again
              </button>
            </p>
            <Link href="/login" className="auth-submit-btn" style={{ marginTop: 20, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">Enter your email and we&apos;ll send a reset link</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field-group">
                <label className="auth-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <><span className="auth-spinner" />Sending…</> : 'Send reset link'}
              </button>
            </form>

            <p className="auth-switch">
              <Link href="/login" className="auth-link">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
