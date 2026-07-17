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

function validate(fields: {
  fullName: string
  email: string
  password: string
  confirm: string
  tos: boolean
  privacy: boolean
}): string | null {
  if (!fields.fullName.trim()) return 'Full name is required.'
  if (fields.fullName.trim().length < 2) return 'Full name must be at least 2 characters.'
  if (!fields.email.includes('@')) return 'Enter a valid email address.'
  if (fields.password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(fields.password)) return 'Password must contain an uppercase letter.'
  if (!/[0-9]/.test(fields.password)) return 'Password must contain a number.'
  if (!/[^A-Za-z0-9]/.test(fields.password)) return 'Password must contain a special character.'
  if (fields.password !== fields.confirm) return 'Passwords do not match.'
  if (!fields.tos) return 'You must accept the Terms of Service.'
  if (!fields.privacy) return 'You must agree to the Privacy Policy and consent to data processing.'
  return null
}

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [tos, setTos] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [marketing, setMarketing] = useState(false)

  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(password)
  const strengthBars = [1, 2, 3, 4, 5]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validate({ fullName, email, password, confirm, tos, privacy })
    if (validationError) { setError(validationError); return }

    setLoading(true)
    const supabase = createClient()
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), marketing_consent: marketing },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Email confirmation disabled → user is immediately signed in
    if (signUpData.session && signUpData.user) {
      // Ensure profile row exists (safety net in case trigger didn't fire)
      await supabase.from('profiles').upsert(
        { id: signUpData.user.id, full_name: fullName.trim(), email_verified: true },
        { onConflict: 'id', ignoreDuplicates: true },
      )
      router.push('/onboarding')
      router.refresh()
      return
    }

    router.push('/verify-email?email=' + encodeURIComponent(email))
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (authError) {
      setError(authError.message)
      setOauthLoading(null)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/" className="auth-logo-text">Lexuri</Link>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start learning smarter today — it&apos;s free</p>

        {/* OAuth */}
        <div className="auth-oauth-group">
          <button
            type="button"
            className="auth-oauth-btn"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? <span className="auth-spinner" /> : <GoogleIcon />}
            Sign up with Google
          </button>
          <button
            type="button"
            className="auth-oauth-btn"
            onClick={() => handleOAuth('github')}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'github' ? <span className="auth-spinner" /> : <GitHubIcon />}
            Sign up with GitHub
          </button>
        </div>

        <div className="auth-divider"><span>or register with email</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              className="auth-input"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

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

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="password">Password</label>
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="auth-field-error">Passwords don&apos;t match</p>
            )}
            {confirm && password === confirm && confirm.length > 0 && (
              <p className="auth-field-ok">Passwords match</p>
            )}
          </div>

          <div className="auth-checks">
            <label className="auth-checkbox-label">
              <input type="checkbox" className="auth-checkbox" checked={tos} onChange={(e) => setTos(e.target.checked)} required />
              I accept the{' '}
              <Link href="/terms" className="auth-link" target="_blank">Terms of Service</Link>
            </label>
            <label className="auth-checkbox-label">
              <input type="checkbox" className="auth-checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required />
              I agree to the{' '}
              <Link href="/privacy" className="auth-link" target="_blank">Privacy Policy</Link>
              {' '}and consent to data processing
            </label>
            <label className="auth-checkbox-label" style={{ color: 'var(--auth-muted)' }}>
              <input type="checkbox" className="auth-checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              Send me tips and product updates (optional)
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <><span className="auth-spinner" />Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.612 14.41 17.64 11.967 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
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
