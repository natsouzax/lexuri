'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

type Strength = { score: number; label: string; color: string }

function getPasswordStrength(pw: string): Strength {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score, label: 'Good', color: '#3b82f6' }
  return { score, label: 'Strong', color: '#22c55e' }
}

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const strength = getPasswordStrength(password)
  const strengthBars = [1, 2, 3, 4, 5]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(password)) { setError('Password must contain an uppercase letter.'); return }
    if (!/[0-9]/.test(password)) { setError('Password must contain a number.'); return }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain a special character.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <Link href="/" className="auth-logo-text">Lexuri</Link>
          </div>
          <div className="auth-success-block">
            <div className="auth-success-icon" style={{ color: '#22c55e' }}>✓</div>
            <h1 className="auth-title">Password updated</h1>
            <p className="auth-subtitle">Redirecting you to login…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/" className="auth-logo-text">Lexuri</Link>
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="password">New password</label>
            <div className="auth-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="auth-input auth-input-padded"
                placeholder="Min 8 chars, upper, number, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {password && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {strengthBars.map((n) => (
                    <div
                      key={n}
                      className="auth-strength-bar"
                      style={{ background: n <= strength.score ? strength.color : undefined }}
                    />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="confirm">Confirm password</label>
            <div className="auth-input-wrap">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="auth-input auth-input-padded"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="auth-field-error">Passwords don&apos;t match</p>
            )}
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <><span className="auth-spinner" />Updating…</> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
