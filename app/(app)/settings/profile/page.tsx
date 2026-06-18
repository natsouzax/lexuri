'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function ProfileSettingsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [emailReminders, setEmailReminders] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '')
        setFullName(data.user.user_metadata?.full_name ?? '')
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_reminders')
          .eq('id', data.user.id)
          .single()
        if (profile) setEmailReminders(profile.email_reminders ?? true)
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
        await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), email_reminders: emailReminders, updated_at: new Date().toISOString() })
        .eq('id', user.id)
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

          <div className="auth-field-group" style={{ marginTop: 20 }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={emailReminders}
                onChange={(e) => setEmailReminders(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--clay)' }}
              />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>
                Receber lembretes diários de revisão por email
              </span>
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, marginLeft: 30 }}>
              Avisamos quando você tem flashcards prontos para revisar.
            </p>
          </div>

          {success && <div className="alert-info" style={{ marginTop: 16 }}>{success}</div>}
          {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? <><span className="spinner" />Saving…</> : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>English Level</div>
      <div className="card" style={{ maxWidth: 480 }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Not sure of your level? Take a quick 10-question test to calibrate your CEFR level.
        </p>
        <Link href="/placement-test" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.88rem' }}>
          Take placement test →
        </Link>
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>Plano & Acesso</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
        <Link href="/settings/billing" style={{ textDecoration: 'none' }}>
          <div className="settings-nav-card">
            <span className="settings-nav-icon">⭐</span>
            <div>
              <div className="settings-nav-title">Plano & Faturamento</div>
              <div className="settings-nav-desc">Ver seu plano atual e resgatar cupons</div>
            </div>
            <span className="settings-nav-arrow">→</span>
          </div>
        </Link>
        <Link href="/plans" style={{ textDecoration: 'none' }}>
          <div className="settings-nav-card">
            <span className="settings-nav-icon">🚀</span>
            <div>
              <div className="settings-nav-title">Ver Planos</div>
              <div className="settings-nav-desc">Conheça os benefícios do Premium</div>
            </div>
            <span className="settings-nav-arrow">→</span>
          </div>
        </Link>
      </div>
    </>
  )
}
