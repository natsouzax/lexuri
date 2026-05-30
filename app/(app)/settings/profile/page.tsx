'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function ProfileSettingsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '')
        setFullName(data.user.user_metadata?.full_name ?? '')
      }
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      // Sync to profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ full_name: fullName.trim(), updated_at: new Date().toISOString() }).eq('id', user.id)
      }
      setSuccess('Profile updated.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <div className="app-hero">
          <h1 className="app-hero-title">Profile</h1>
        </div>
        <p style={{ color: 'var(--muted)', padding: '32px 0' }}><span className="spinner" />Loading…</p>
      </>
    )
  }

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Profile</h1>
        <p className="app-hero-subtitle">Update your personal information</p>
      </div>

      <div className="section-title">Personal info</div>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSave}>
          <div className="auth-field-group">
            <label className="auth-label" style={{ color: 'var(--muted)' }} htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-field-group" style={{ marginTop: 14 }}>
            <label className="auth-label" style={{ color: 'var(--muted)' }} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              disabled
              style={{ opacity: 0.55, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
              Email changes are not supported yet.
            </p>
          </div>

          {success && <div className="alert-info" style={{ marginTop: 16 }}>{success}</div>}
          {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : 'Save changes'}
          </button>
        </form>
      </div>
    </>
  )
}
