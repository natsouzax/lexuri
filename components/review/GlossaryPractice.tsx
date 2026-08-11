'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { playSuccess, playTap } from '@/lib/sfx'
import { awardXP } from '@/lib/xp'
import type {
  GlossaryAssessment,
  GlossaryExample,
  GlossaryPracticePrompt,
} from '@/lib/glossary-practice'

interface PracticeData {
  prompt: GlossaryPracticePrompt | null
  stats: { total: number; practised: number; due: number }
  nextReviewAt: string | null
}

interface SaveResult {
  example: GlossaryExample
  firstPractice: boolean
  intervalDays: number
  nextReviewAt: string
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options)
  const data = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data as T
}

export default function GlossaryPractice() {
  const [data, setData] = useState<PracticeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [originalAnswer, setOriginalAnswer] = useState('')
  const [assessment, setAssessment] = useState<GlossaryAssessment | null>(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SaveResult | null>(null)
  const [error, setError] = useState('')

  const loadPrompt = useCallback(async (takeawayId?: string, skippedId?: string) => {
    setLoading(true)
    setError('')
    setAssessment(null)
    setSaved(null)
    setAnswer('')
    setOriginalAnswer('')
    try {
      const query = new URLSearchParams()
      if (takeawayId) query.set('takeaway_id', takeawayId)
      if (skippedId) query.set('skip_takeaway_id', skippedId)
      const suffix = query.size > 0 ? `?${query.toString()}` : ''
      setData(await apiFetch<PracticeData>(`/api/glossary-practice${suffix}`))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadPrompt() }, [loadPrompt])

  async function checkAnswer() {
    if (!data?.prompt || !answer.trim() || checking) return
    playTap()
    setChecking(true)
    setError('')
    setSaved(null)
    if (!originalAnswer) setOriginalAnswer(answer.trim())
    try {
      setAssessment(await apiFetch<GlossaryAssessment>('/api/glossary-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess',
          takeawayId: data.prompt.takeawayId,
          expression: data.prompt.expression,
          question: data.prompt.question,
          answer: answer.trim(),
        }),
      }))
    } catch (assessmentError) {
      setError(assessmentError instanceof Error ? assessmentError.message : String(assessmentError))
    } finally {
      setChecking(false)
    }
  }

  async function saveAnswer() {
    if (!data?.prompt || !assessment?.accepted || saving) return
    setSaving(true)
    setError('')
    try {
      const result = await apiFetch<SaveResult>('/api/glossary-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          takeawayId: data.prompt.takeawayId,
          expression: data.prompt.expression,
          question: data.prompt.question,
          answer: answer.trim(),
          originalAnswer: originalAnswer || answer.trim(),
          feedback: assessment.feedback,
        }),
      })
      playSuccess()
      setSaved(result)
      void awardXP(
        'glossary_example_created',
        `glossary-example:${result.example.id}`,
        { takeawayId: result.example.takeaway_id },
      )
      setData((current) => current ? {
        ...current,
        stats: {
          ...current.stats,
          practised: result.firstPractice
            ? Math.min(current.stats.total, current.stats.practised + 1)
            : current.stats.practised,
          due: Math.max(0, current.stats.due - 1),
        },
      } : current)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  const prompt = data?.prompt ?? null

  return (
    <section className="panel" style={{ marginBottom: 32, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <span className="mini-label">Make it yours</span>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.2rem', margin: '6px 0 4px' }}>
            Use English in your real life
          </h2>
          <p className="panel-copy" style={{ margin: 0 }}>
            Answer one personal question with an expression from your Glossary.
          </p>
        </div>
        {data && data.stats.total > 0 && (
          <span style={{ borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)', padding: '5px 11px', fontSize: '0.72rem', fontWeight: 800 }}>
            {data.stats.due} due · {data.stats.practised}/{data.stats.total} practised
          </span>
        )}
      </div>

      {loading && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--muted)', marginTop: 18, fontSize: '0.85rem' }}>
          <span className="spinner" /> Creating a question for you…
        </div>
      )}

      {!loading && error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {!loading && data?.stats.total === 0 && (
        <div style={{ marginTop: 18, borderRadius: 14, background: '#fff', border: '1px solid var(--line)', padding: 16 }}>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.55 }}>
            Your Glossary is still empty. Finish a Day 3 review and write what stayed with you first.
          </p>
          <Link href="/feed" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>Choose a song</Link>
        </div>
      )}

      {!loading && data && data.stats.total > 0 && !prompt && (
        <div style={{ marginTop: 18, borderRadius: 14, background: 'var(--sage)', color: 'var(--moss)', padding: 16 }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>
            {data.stats.due > 0 ? 'No other expression is due.' : 'You are caught up.'}
          </strong>
          <span style={{ fontSize: '0.82rem' }}>
            {data.stats.due > 0
              ? 'The expression you skipped stays in your queue for later.'
              : data.nextReviewAt
              ? `Your next personal expression returns ${new Date(data.nextReviewAt).toLocaleDateString()}.`
              : 'Add more learnings through a Day 3 review.'}
          </span>
        </div>
      )}

      {!loading && prompt && !saved && (
        <div style={{ marginTop: 18, borderRadius: 16, background: '#fff', border: '1px solid var(--line)', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Target expression</span>
            <strong style={{ borderRadius: 999, padding: '4px 11px', color: 'var(--clay)', background: 'rgba(200,111,74,0.12)', fontSize: '0.84rem' }}>
              {prompt.expression}
            </strong>
          </div>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 800, fontSize: '1.08rem', lineHeight: 1.5, margin: '0 0 6px' }}>
            {prompt.question}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: 1.5, margin: '0 0 13px' }}>{prompt.instruction}</p>
          <textarea
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value)
              setAssessment(null)
              setSaved(null)
            }}
            rows={4}
            maxLength={1000}
            placeholder={`Write a complete answer using “${prompt.expression}”…`}
            style={{ width: '100%', resize: 'vertical', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '11px 13px', fontSize: '0.9rem', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => void loadPrompt(prompt.takeawayId)}
                disabled={checking || saving}
                className="btn-secondary"
                style={{ padding: '8px 14px' }}
              >
                Another question
              </button>
              <button
                type="button"
                onClick={() => void loadPrompt(undefined, prompt.takeawayId)}
                disabled={checking || saving}
                style={{ border: 'none', background: 'transparent', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer', padding: '8px 4px' }}
              >
                Skip expression
              </button>
            </div>
            <button
              type="button"
              onClick={checkAnswer}
              disabled={!answer.trim() || checking || saving}
              className="btn-primary"
              style={{ padding: '9px 20px' }}
            >
              {checking ? <><span className="spinner" /> Checking…</> : 'Check my answer'}
            </button>
          </div>

          {assessment && (
            <div
              role="status"
              aria-live="polite"
              style={{ marginTop: 14, borderRadius: 12, padding: '12px 13px', background: assessment.accepted ? 'var(--sage)' : 'rgba(246,202,95,0.18)', color: assessment.accepted ? 'var(--moss)' : 'var(--ink)' }}
            >
              <strong style={{ display: 'block', fontSize: '0.84rem', marginBottom: 4 }}>
                {assessment.accepted ? 'Complete answer ✓' : 'Almost there'}
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{assessment.feedback}</p>
              {assessment.suggestion && (
                <button
                  type="button"
                  onClick={() => { setAnswer(assessment.suggestion!); setAssessment(null) }}
                  style={{ marginTop: 9, border: 'none', background: 'transparent', color: 'var(--clay)', padding: 0, fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  Use suggestion: “{assessment.suggestion}”
                </button>
              )}
              {assessment.accepted && (
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <button type="button" className="btn-primary" onClick={saveAnswer} disabled={saving} style={{ padding: '8px 16px' }}>
                    {saving ? <><span className="spinner" /> Saving…</> : 'Save to My own examples'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {saved && (
        <div role="status" aria-live="polite" style={{ marginTop: 18, borderRadius: 14, background: 'var(--sage)', color: 'var(--moss)', padding: 16 }}>
          <strong style={{ display: 'block', marginBottom: 5 }}>Personal example saved</strong>
          <p style={{ margin: '0 0 12px', fontSize: '0.84rem', lineHeight: 1.5 }}>“{saved.example.answer}”</p>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary" onClick={() => void loadPrompt()} style={{ padding: '8px 15px' }}>Practise another</button>
            <Link href="/flashcards" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 15px' }}>Open Library</Link>
          </div>
        </div>
      )}

      <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: '0.7rem', lineHeight: 1.45 }}>
        You can change the question. Unsaved answers are not stored; accepted answers become part of your personal Glossary.
      </p>
    </section>
  )
}
