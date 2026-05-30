'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function SessionsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [signedOut, setSignedOut] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
      setLastSignIn(data.user?.last_sign_in_at ?? null)
    })
  }, [])

  async function handleSignOutAll() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'global' })
    setSignedOut(true)
    setTimeout(() => router.push('/login'), 1500)
  }

  async function handleSignOutLocal() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Sessions</h1>
        <p className="app-hero-subtitle">Manage where you&apos;re signed in</p>
      </div>

      <div className="section-title">Current session</div>
      <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(70,98,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            🖥
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>This device</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{email}</div>
            {lastSignIn && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                Last sign-in: {new Date(lastSignIn).toLocaleString()}
              </div>
            )}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 900, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)', padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active
          </span>
        </div>

        {signedOut ? (
          <div className="alert-info">Signed out from all devices. Redirecting…</div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              onClick={handleSignOutLocal}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? <><span className="spinner" />…</> : 'Sign out here'}
            </button>
            <button
              className="btn-primary"
              onClick={handleSignOutAll}
              disabled={loading}
              style={{ flex: 1, background: 'var(--clay)' }}
            >
              Sign out everywhere
            </button>
          </div>
        )}
      </div>

      <div className="alert-info">
        Supabase Auth issues short-lived JWTs. Signing out everywhere invalidates your refresh token so new sessions cannot be created from any device.
      </div>
    </>
  )
}
