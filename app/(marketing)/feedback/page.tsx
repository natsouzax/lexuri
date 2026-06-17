'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { EASE_OUT, EASE_SPRING } from '@/lib/easing'

const CATEGORIES = [
  { value: 'bug',         label: '🐛 Bug',           hint: 'Something is broken or not working as expected.' },
  { value: 'ux',          label: '🎨 UX / Design',    hint: 'A flow felt confusing, a button was missing, something looked off.' },
  { value: 'feature',     label: '✨ Feature idea',    hint: 'Something you wish Lexuri could do.' },
  { value: 'content',     label: '📚 Content',         hint: 'Issues with transcripts, chunk detection, or translations.' },
  { value: 'performance', label: '⚡ Performance',     hint: 'Slow loading, freezing, or crashes.' },
  { value: 'other',       label: '💬 Other',           hint: 'Anything else — general thoughts, questions, praise.' },
]

const PLACEHOLDERS: Record<string, string> = {
  bug:         'What happened?\nWhat did you expect to happen?\nSteps to reproduce: 1. ...',
  ux:          'What felt confusing or awkward?\nWhich screen / flow?\nWhat would make it clearer?',
  feature:     'What would you like Lexuri to do?\nHow would this help your learning?',
  content:     'What felt wrong or missing?\nVideo URL or song name (if relevant):',
  performance: 'What were you doing when it slowed down / crashed?\nDevice and browser:',
  other:       'What\'s on your mind? Any thoughts, questions, or suggestions are welcome.',
}

const RATINGS = [
  { value: 1, emoji: '😕', label: 'Not great'  },
  { value: 2, emoji: '😐', label: 'Meh'         },
  { value: 3, emoji: '🙂', label: 'Good'        },
  { value: 4, emoji: '😊', label: 'Great'       },
  { value: 5, emoji: '🤩', label: 'Amazing!'    },
]

export default function FeedbackPage() {
  const [rating,        setRating]        = useState(0)
  const [hovered,       setHovered]       = useState(0)
  const [category,      setCategory]      = useState('')
  const [message,       setMessage]       = useState('')
  const [email,         setEmail]         = useState('')
  const [sent,          setSent]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  const activeRating = hovered || rating
  const charCount    = message.trim().length
  const canSubmit    = !!category && charCount >= 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, email, rating: rating || null }),
      })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setRating(0); setHovered(0); setCategory(''); setMessage(''); setEmail(''); setSent(false); setError('')
  }

  return (
    <section
      className="mkt-section mkt-section-cream"
      style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}
    >
      <div className="mkt-container" style={{ maxWidth: 600, paddingTop: 48, paddingBottom: 64 }}>
        <AnimatePresence mode="wait">

          {/* ── Success state ── */}
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1,   y: 0  }}
              exit={{    opacity: 0, scale: 0.95         }}
              transition={{ duration: 0.5, ease: EASE_SPRING }}
              style={{ textAlign: 'center', padding: '64px 0' }}
            >
              <motion.div
                style={{ fontSize: '4rem', marginBottom: 24 }}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 14 }}
              >
                🎉
              </motion.div>

              <motion.h2
                className="mkt-h2"
                style={{ marginBottom: 12 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4, ease: EASE_OUT }}
              >
                Thank you!
              </motion.h2>

              <motion.p
                className="mkt-lead"
                style={{ maxWidth: 420, margin: '0 auto 40px' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.4, ease: EASE_OUT }}
              >
                Your feedback helps us build a better Lexuri. Every message is reviewed by the team.
              </motion.p>

              <motion.div
                style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.4, ease: EASE_OUT }}
              >
                <motion.button
                  onClick={reset}
                  className="btn-mkt-ghost"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Send another →
                </motion.button>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/" className="btn-mkt-primary">Back to home</Link>
                </motion.div>
              </motion.div>
            </motion.div>

          ) : (

            /* ── Form state ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              {/* Header */}
              <div style={{ marginBottom: 40 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'rgba(200,111,74,0.1)',
                    border: '1px solid rgba(200,111,74,0.28)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    marginBottom: 18,
                  }}
                >
                  <span style={{ fontSize: '0.72rem' }}>🧪</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clay)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Beta Testing
                  </span>
                </motion.div>

                <motion.h1
                  className="mkt-h2"
                  style={{ marginBottom: 10 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.45, ease: EASE_OUT }}
                >
                  Share your feedback
                </motion.h1>

                <motion.p
                  className="mkt-lead"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.45, ease: EASE_OUT }}
                >
                  You&apos;re helping shape Lexuri. Every message is read — the good, the bad, and the ugly.
                </motion.p>
              </div>

              <form onSubmit={handleSubmit}>

                {/* ── Rating ── */}
                <motion.div
                  style={{ marginBottom: 36 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4, ease: EASE_OUT }}
                >
                  <p style={{ fontWeight: 900, fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 14, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Overall experience
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {RATINGS.map((r) => {
                      const isSel    = rating  === r.value
                      const isActive = hovered === r.value
                      return (
                        <motion.button
                          key={r.value}
                          type="button"
                          onClick={() => setRating(r.value)}
                          onMouseEnter={() => setHovered(r.value)}
                          onMouseLeave={() => setHovered(0)}
                          whileHover={{ y: -4, scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          animate={isSel ? { scale: [1, 1.22, 1] } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 5,
                            padding: '10px 12px',
                            borderRadius: 14,
                            border: `1.5px solid ${isSel ? 'var(--clay)' : isActive ? 'var(--line)' : 'var(--line)'}`,
                            background: isSel ? 'rgba(200,111,74,0.1)' : isActive ? 'rgba(24,33,29,0.04)' : '#fff',
                            cursor: 'pointer',
                            minWidth: 58,
                            fontFamily: 'inherit',
                            transition: 'border-color 120ms, background 120ms',
                          }}
                        >
                          <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{r.emoji}</span>
                          <span style={{
                            fontSize: '0.62rem', fontWeight: 700,
                            color: isSel ? 'var(--clay)' : 'var(--muted)',
                            whiteSpace: 'nowrap',
                          }}>
                            {r.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>

                {/* ── Category ── */}
                <motion.div
                  style={{ marginBottom: 28 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: EASE_OUT }}
                >
                  <p style={{ fontWeight: 900, fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    What is this about?{' '}
                    <span style={{ color: 'var(--clay)' }}>*</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map((cat, i) => {
                      const isSel = category === cat.value
                      return (
                        <motion.button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.32 + i * 0.05, duration: 0.3 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          style={{
                            padding: '7px 15px',
                            borderRadius: 999,
                            border: `1.5px solid ${isSel ? 'var(--clay)' : 'var(--line)'}`,
                            background: isSel ? 'rgba(200,111,74,0.1)' : '#fff',
                            color: isSel ? 'var(--clay)' : 'var(--ink)',
                            fontFamily: 'inherit',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'border-color 120ms, background 120ms, color 120ms',
                          }}
                        >
                          {cat.label}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Category hint */}
                  <AnimatePresence initial={false}>
                    {category && (
                      <motion.p
                        key={category}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                        exit={{    opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.22, ease: EASE_OUT }}
                        style={{ fontSize: '0.78rem', color: 'var(--muted)', overflow: 'hidden', paddingLeft: 2 }}
                      >
                        {CATEGORIES.find(c => c.value === category)?.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Message ── */}
                <motion.div
                  style={{ marginBottom: 20 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.4, ease: EASE_OUT }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.78rem', color: 'var(--muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                      Message <span style={{ color: 'var(--clay)' }}>*</span>
                    </p>
                    <motion.span
                      animate={{ color: charCount >= 10 ? 'var(--moss)' : 'var(--muted)' }}
                      transition={{ duration: 0.2 }}
                      style={{ fontSize: '0.7rem', fontWeight: 700 }}
                    >
                      {charCount < 10
                        ? `${10 - charCount} more to go`
                        : `${charCount} chars`}
                    </motion.span>
                  </div>
                  <textarea
                    className="contact-field"
                    placeholder={category
                      ? PLACEHOLDERS[category]
                      : 'Pick a category above, then describe your feedback here…'}
                    rows={6}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    style={{ marginBottom: 0, resize: 'vertical' }}
                  />
                </motion.div>

                {/* ── Email (optional) ── */}
                <motion.div
                  style={{ marginBottom: 32 }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.44, duration: 0.4, ease: EASE_OUT }}
                >
                  <p style={{ fontWeight: 900, fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Email{' '}
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>
                      (optional — we&apos;ll follow up if needed)
                    </span>
                  </p>
                  <input
                    className="contact-field"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1,  y: 0 }}
                    style={{ color: '#e05a2b', fontSize: '0.85rem', marginBottom: 16, fontWeight: 700 }}
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  className="btn-mkt-primary"
                  disabled={loading || !canSubmit}
                  whileHover={canSubmit && !loading ? { scale: 1.02 } : {}}
                  whileTap={canSubmit && !loading  ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: EASE_OUT }}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    opacity: !canSubmit ? 0.45 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'pointer',
                    transition: 'opacity 200ms',
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="auth-spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Sending…
                    </span>
                  ) : (
                    'Send feedback →'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
