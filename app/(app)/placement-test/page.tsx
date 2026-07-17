'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONS, LEVEL_DESCRIPTIONS, computeLevel } from '@/lib/placement-questions'

type Phase = 'intro' | 'questions' | 'result'

export default function PlacementTestPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))
  const [result, setResult] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...answers]
    newAnswers[currentQ] = optionIndex
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 280)
    } else {
      const level = computeLevel(newAnswers)
      setResult(level)
      setTimeout(() => setPhase('result'), 280)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/placement-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: result }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to save')
      }
      router.push('/dashboard')
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const progressPct = phase === 'questions'
    ? Math.round(((currentQ) / QUESTIONS.length) * 100)
    : phase === 'result' ? 100 : 0

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

      {/* Header */}
      <div className="app-hero" style={{ marginLeft: -48, marginRight: -48, paddingLeft: 48, paddingRight: 48 }}>
        <p className="app-hero-subtitle">English Level Assessment</p>
        <h1 className="app-hero-title">Placement Test</h1>
        <p className="app-hero-body">
          10 questions · ~3 minutes · Calibrates your CEFR level
        </p>
      </div>

      {/* Progress bar */}
      {phase !== 'intro' && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)' }}>
              {phase === 'result' ? 'Complete' : `Question ${currentQ + 1} of ${QUESTIONS.length}`}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{progressPct}%</span>
          </div>
          <div className="xp-bar-track-light">
            <div className="xp-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Intro ── */}
      {phase === 'intro' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 20, color: 'var(--clay)' }}>◉</div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.5rem', marginBottom: 12 }}>
            Find your level
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
            Answer 10 grammar and vocabulary questions. No time limit. We&apos;ll calculate your CEFR level automatically.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button className="btn-primary btn-wide" style={{ maxWidth: 280 }} onClick={() => setPhase('questions')}>
              Start test →
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'underline' }}
              onClick={() => router.push('/dashboard')}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ── Questions ── */}
      {phase === 'questions' && (
        <div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Level {QUESTIONS[currentQ].level}
            </span>
          </div>
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.5, marginBottom: 24, color: 'var(--ink)' }}>
            {QUESTIONS[currentQ].question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUESTIONS[currentQ].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: '1.5px solid var(--line)',
                  background: '#fff',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 120ms ease, background 120ms ease, transform 80ms ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--clay)'
                  el.style.background = 'rgba(200,111,74,0.06)'
                  el.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--line)'
                  el.style.background = '#fff'
                  el.style.transform = 'translateX(0)'
                }}
              >
                <span style={{ marginRight: 12, fontSize: '0.72rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {phase === 'result' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '3.5rem', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, color: 'var(--clay)', marginBottom: 8 }}>
            {result}
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.4rem', marginBottom: 10 }}>
            Your level is {result}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
            {LEVEL_DESCRIPTIONS[result]}
          </p>

          {/* Score breakdown */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {(['A2', 'B1', 'B2', 'C1'] as const).map((lvl) => {
              const qs = QUESTIONS.filter((q) => q.level === lvl)
              const correct = qs.filter((q) => answers[QUESTIONS.indexOf(q)] === q.correct).length
              return (
                <div key={lvl} style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: '#fff',
                  textAlign: 'center',
                  minWidth: 70,
                }}>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--ink)' }}>{correct}/{qs.length}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{lvl}</div>
                </div>
              )
            })}
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button className="btn-primary btn-wide" style={{ maxWidth: 280 }} onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" />Saving…</> : `Save my level (${result}) →`}
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'underline' }}
              onClick={() => { setPhase('questions'); setCurrentQ(0); setAnswers(Array(QUESTIONS.length).fill(null)); setResult('') }}
            >
              Retake test
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
