'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const NATIVE_LANGUAGES = [
  'Portuguese', 'Spanish', 'French', 'German', 'Italian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian',
  'Hindi', 'Turkish', 'Other',
]
const LEVELS = [
  { code: 'A1', label: 'A1', desc: 'Beginner' },
  { code: 'A2', label: 'A2', desc: 'Elementary' },
  { code: 'B1', label: 'B1', desc: 'Intermediate' },
  { code: 'B2', label: 'B2', desc: 'Upper Intermediate' },
  { code: 'C1', label: 'C1', desc: 'Advanced' },
  { code: 'C2', label: 'C2', desc: 'Proficient' },
]
const GOALS = [
  { id: 'vocabulary',   label: 'Vocabulary', icon: '📚' },
  { id: 'conversation', label: 'Conversation', icon: '💬' },
  { id: 'pronunciation', label: 'Pronunciation', icon: '🗣️' },
  { id: 'grammar',      label: 'Grammar', icon: '✏️' },
  { id: 'business',     label: 'Business Language', icon: '💼' },
  { id: 'exam',         label: 'Exam Preparation', icon: '🎯' },
]

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nativeLanguage, setNativeLanguage] = useState('Portuguese')
  const [level, setLevel] = useState('B1')
  const [goals, setGoals] = useState<string[]>(['vocabulary'])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  async function handleFinish() {
    if (goals.length === 0) { setError('Select at least one goal.'); return }
    setError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: dbError } = await supabase.from('onboarding').upsert({
      user_id: user.id,
      native_language: nativeLanguage,
      current_level: level,
      learning_goals: goals,
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/youtube')
    router.refresh()
  }

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="onboard-shell">
      {/* Top bar */}
      <div className="onboard-top">
        <span className="onboard-logo">Verbly</span>
        <span className="onboard-step-counter">Step {step} of {TOTAL_STEPS}</span>
      </div>

      {/* Progress bar */}
      <div className="onboard-progress-track">
        <div className="onboard-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="onboard-body">
        {/* Step 1 — Native language */}
        {step === 1 && (
          <div className="onboard-step animate-fade-up">
            <div className="onboard-step-icon">🌍</div>
            <h1 className="onboard-title">What&apos;s your native language?</h1>
            <p className="onboard-desc">
              Verbly teaches English. We&apos;ll use your native language to show translations and explanations in a way that makes sense to you.
            </p>
            <div className="onboard-options-grid">
              {NATIVE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  className={`onboard-option${nativeLanguage === lang ? ' selected' : ''}`}
                  onClick={() => setNativeLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Level */}
        {step === 2 && (
          <div className="onboard-step animate-fade-up">
            <div className="onboard-step-icon">📊</div>
            <h1 className="onboard-title">What&apos;s your current level?</h1>
            <p className="onboard-desc">Be honest — this helps us pick the right content difficulty.</p>
            <div className="onboard-level-grid">
              {LEVELS.map((l) => (
                <button
                  key={l.code}
                  className={`onboard-level${level === l.code ? ' selected' : ''}`}
                  onClick={() => setLevel(l.code)}
                >
                  <span className="onboard-level-code">{l.label}</span>
                  <span className="onboard-level-desc">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Goals */}
        {step === 3 && (
          <div className="onboard-step animate-fade-up">
            <div className="onboard-step-icon">🎯</div>
            <h1 className="onboard-title">What are your learning goals?</h1>
            <p className="onboard-desc">Pick everything that applies — you can change this later.</p>
            <div className="onboard-goals-grid">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  className={`onboard-goal${goals.includes(g.id) ? ' selected' : ''}`}
                  onClick={() => toggleGoal(g.id)}
                >
                  <span className="onboard-goal-icon">{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {/* Step 4 — Ready */}
        {step === 4 && (
          <div className="onboard-step animate-fade-up" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="onboard-step-icon" style={{ fontSize: '3.5rem' }}>🚀</div>
            <h1 className="onboard-title">You&apos;re all set!</h1>
            <p className="onboard-desc">
              Your profile is configured. Verbly will now surface the best chunks, vocabulary, and review sessions for your journey.
            </p>

            <div className="onboard-summary">
              <div className="onboard-summary-row">
                <span className="onboard-summary-key">Native language</span>
                <span className="onboard-summary-val">{nativeLanguage}</span>
              </div>
              <div className="onboard-summary-row">
                <span className="onboard-summary-key">Level</span>
                <span className="onboard-summary-val">{level}</span>
              </div>
              <div className="onboard-summary-row">
                <span className="onboard-summary-key">Goals</span>
                <span className="onboard-summary-val">{goals.join(', ')}</span>
              </div>
            </div>

            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="onboard-nav">
          {step > 1 && (
            <button
              className="onboard-btn-secondary"
              onClick={() => setStep((s) => s - 1)}
              disabled={saving}
            >
              ← Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              className="onboard-btn-primary"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue →
            </button>
          ) : (
            <button
              className="onboard-btn-primary"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? <><span className="auth-spinner" />Saving…</> : 'Start learning →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
