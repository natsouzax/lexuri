'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { CheckCircleIcon } from '@/components/ui/Icons'

type FeedbackType = 'bug' | 'suggestion' | 'other'

const TYPES: Array<{ id: FeedbackType; label: string }> = [
  { id: 'bug', label: 'Bug' },
  { id: 'suggestion', label: 'Suggestion' },
  { id: 'other', label: 'Other' },
]

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Página pública de feedback pra testers — sem exigir login, já que quem
// está testando o app pode nem ter conta ainda. E-mail é opcional, só pra
// quem quiser resposta.
export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: message.trim(), email: email.trim() }),
      })
      setSent(true)
      setMessage('')
      setEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mkt-legal">
      <div className="mkt-legal-inner" style={{ maxWidth: 560 }}>
        <div className="mkt-legal-header">
          <p className="mkt-legal-eyebrow" style={{ padding: '60px 32px' }}>
            Help us improve
          </p>
          <h1 className="mkt-legal-title">Send feedback</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, margin: '10px 0 0' }}>
            Found a bug, have an idea, or just want to tell us something? This goes straight to the team —
            no account needed.
          </p>
        </div>

        {sent ? (
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            style={{ textAlign: 'center', padding: '40px 32px', marginTop: 28 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--moss)', marginBottom: 12 }}>
              <CheckCircleIcon size={36} />
            </div>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
              Thanks for the feedback!
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20, lineHeight: 1.6 }}>
              We read every message. If you left an email and this needs a reply, we&apos;ll get back to you.
            </p>
            <button className="btn-secondary" onClick={() => setSent(false)}>
              Send another
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {TYPES.map((tOpt) => (
                <button
                  key={tOpt.id}
                  type="button"
                  onClick={() => setType(tOpt.id)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 999,
                    border: `1.5px solid ${type === tOpt.id ? 'var(--moss)' : 'var(--line)'}`,
                    background: type === tOpt.id ? 'var(--sage)' : '#fff',
                    color: type === tOpt.id ? 'var(--moss)' : 'var(--muted)',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 120ms ease, border-color 120ms ease',
                  }}
                >
                  {tOpt.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'What happened? What did you expect instead?'
                  : type === 'suggestion'
                    ? 'What would make Lexuri better for you?'
                    : 'Tell us anything…'
              }
              rows={6}
              required
              className="contact-field"
              style={{ marginBottom: 12 }}
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional — only if you want a reply)"
              className="contact-field"
              style={{ marginBottom: 4 }}
            />

            {error && <div className="alert-error" style={{ marginTop: 12 }}>{error}</div>}

            <button
              type="submit"
              className="btn-primary btn-wide"
              disabled={!message.trim() || sending}
              style={{ marginTop: 16, opacity: !message.trim() || sending ? 0.6 : 1 }}
            >
              {sending ? <><span className="spinner" /> Sending…</> : 'Send feedback'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem' }}>
          <Link href="/" className="auth-link" style={{ color: 'var(--clay-bright)' }}>
            ← Back to Lexuri
          </Link>
        </p>
      </div>
    </div>
  )
}
