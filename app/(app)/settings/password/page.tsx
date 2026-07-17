'use client'

import { useState } from 'react'
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

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const strength = getPasswordStrength(password)
  const bars = [1, 2, 3, 4, 5]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(password)) { setError('Password must contain an uppercase letter.'); return }
    if (!/[0-9]/.test(password)) { setError('Password must contain a number.'); return }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain a special character.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Password updated successfully.')
      setPassword('')
      setConfirm('')
    }
    setSaving(false)
  }

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Change Password</h1>
        <p className="app-hero-subtitle">Keep your account secure</p>
      </div>

      <div className="section-title">New password</div>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="auth-field-group">
            <label className="auth-label" style={{ color: 'var(--muted)' }} htmlFor="pw">New password</label>
            <div className="auth-input-wrap">
              <input
                id="pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                className="input-field auth-input-padded"
                placeholder="Min 8 chars, upper, number, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                style={{ right: 12 }}
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {password && (
              <div className="auth-strength" style={{ marginTop: 8 }}>
                <div className="auth-strength-bars">
                  {bars.map((n) => (
                    <div key={n} className="auth-strength-bar" style={{ background: n <= strength.score ? strength.color : undefined }} />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div className="auth-field-group" style={{ marginTop: 14 }}>
            <label className="auth-label" style={{ color: 'var(--muted)' }} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="input-field"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {success && <div className="alert-info" style={{ marginTop: 16 }}>{success}</div>}
          {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? <><span className="spinner" />Updating…</> : 'Update password'}
          </button>
        </form>
      </div>
    </>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
