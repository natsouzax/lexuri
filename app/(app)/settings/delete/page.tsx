'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const CONFIRMATION_PHRASE = 'delete my account'

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirm.toLowerCase() !== CONFIRMATION_PHRASE) {
      setError(`Type "${CONFIRMATION_PHRASE}" exactly to confirm.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated.'); setLoading(false); return }

      // Call admin delete via our own API endpoint
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to delete account')
      }

      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Delete Account</h1>
        <p className="app-hero-subtitle">This action is permanent and irreversible</p>
      </div>

      <div className="alert-warn" style={{ marginBottom: 24, maxWidth: 520 }}>
        <strong>Warning:</strong> Deleting your account will permanently remove all your flashcards, learning progress, and profile data. This cannot be undone.
      </div>

      <div className="section-title">Confirm deletion</div>
      <div className="card" style={{ maxWidth: 520, border: '1px solid rgba(200, 80, 60, 0.35)' }}>
        <form onSubmit={handleDelete}>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 18 }}>
            Type <strong style={{ color: 'var(--ink)' }}>{CONFIRMATION_PHRASE}</strong> below to confirm:
          </p>
          <input
            type="text"
            className="input-field"
            placeholder={CONFIRMATION_PHRASE}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />

          {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: 20, background: '#dc2626', boxShadow: '0 2px 10px rgba(220, 38, 38, 0.28)' }}
            disabled={loading || confirm.toLowerCase() !== CONFIRMATION_PHRASE}
          >
            {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Deleting…</> : 'Permanently delete my account'}
          </button>
        </form>
      </div>
    </>
  )
}
