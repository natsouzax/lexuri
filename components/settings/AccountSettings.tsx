'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  email: string
  initialFullName: string
  initialMarketingConsent: boolean
  consentVersion: string | null
  consentAcceptedAt: string | null
}

async function jsonRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  const data = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data
}

export default function AccountSettings({
  email,
  initialFullName,
  initialMarketingConsent,
  consentVersion,
  consentAcceptedAt,
}: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await jsonRequest('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, marketingConsent }),
      })
      setSaved(true)
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    setError('')
    try {
      await jsonRequest('/api/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify({ confirmation }),
      })
      router.replace('/?account_deleted=1')
      router.refresh()
    } catch (deletionError) {
      setError(deletionError instanceof Error ? deletionError.message : String(deletionError))
      setDeleting(false)
    }
  }

  return (
    <div className="settings-grid">
      {error && <p className="settings-alert settings-alert-error" role="alert">{error}</p>}

      <section className="settings-card">
        <span className="mini-label">Profile</span>
        <h2>Your account</h2>
        <form onSubmit={saveProfile} className="settings-form">
          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            Email
            <input value={email} disabled />
          </label>
          <label className="settings-check">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
            />
            <span>
              <strong>Product tips and updates</strong>
              <small>Optional. You can withdraw this consent at any time.</small>
            </span>
          </label>
          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && <span className="settings-saved" role="status">Saved</span>}
          </div>
        </form>
      </section>

      <section className="settings-card">
        <span className="mini-label">Privacy</span>
        <h2>Your data</h2>
        <p>
          Review the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.
          You can also request a structured copy of your data by email using the contact listed in the Privacy Policy.
        </p>
        {consentAcceptedAt ? (
          <p className="settings-consent-record">
            Latest recorded acceptance: version {consentVersion ?? 'unknown'} on{' '}
            {new Date(consentAcceptedAt).toLocaleDateString()}.
          </p>
        ) : (
          <p className="settings-consent-record">
            This account predates auditable consent records. The current documents remain available above.
          </p>
        )}
      </section>

      <section className="settings-card settings-danger">
        <span className="mini-label">Danger zone</span>
        <h2>Delete account</h2>
        <p>
          This permanently deletes your account, learning history, saved words, generated content,
          consent records, and saved song recordings. This cannot be undone.
        </p>
        <label>
          Type <strong>{email}</strong> to confirm
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="settings-delete-button"
          onClick={deleteAccount}
          disabled={deleting || confirmation.trim().toLowerCase() !== email.toLowerCase()}
        >
          {deleting ? 'Deleting account…' : 'Delete my account'}
        </button>
      </section>
    </div>
  )
}
