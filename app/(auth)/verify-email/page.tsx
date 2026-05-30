'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  async function handleResend() {
    if (!email) return
    setResending(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
    } else {
      setResent(true)
    }
    setResending(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <Link href="/" className="auth-logo-text">Verbly</Link>
        </div>

        <div className="auth-success-block">
          <div className="auth-success-icon">✉</div>
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">
            We sent a confirmation link to{' '}
            {email ? <strong>{email}</strong> : 'your email address'}.
            <br />
            Click the link to activate your account.
          </p>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resent ? (
              <p className="auth-field-ok" style={{ textAlign: 'center' }}>Email resent successfully!</p>
            ) : (
              <button
                className="auth-submit-btn"
                onClick={handleResend}
                disabled={resending || !email}
                style={{ width: '100%' }}
              >
                {resending ? <><span className="auth-spinner" />Resending…</> : 'Resend verification email'}
              </button>
            )}
            {error && <p className="auth-error">{error}</p>}

            <Link href="/login" className="auth-link" style={{ textAlign: 'center' }}>
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
