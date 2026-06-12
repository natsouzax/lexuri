'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { recommendedLessons } from '@/lib/product'

const GOALS = [
  { id: 'travel', label: 'Travel' },
  { id: 'work', label: 'Work' },
  { id: 'fluency', label: 'Fluency' },
  { id: 'exams', label: 'Exams' },
  { id: 'conversation', label: 'Daily Conversation' },
]

const INTERESTS = [
  'Technology',
  'Business',
  'Science',
  'Sports',
  'Music',
  'Movies',
]

const TOTAL_STEPS = 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('fluency')
  const [interests, setInterests] = useState<string[]>(['Technology', 'Music'])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    )
  }

  async function handleFinish() {
    if (!goal || interests.length === 0) {
      setError('Choose one goal and at least one interest.')
      return
    }

    setError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: dbError } = await supabase.from('onboarding').upsert({
      user_id: user.id,
      native_language: 'Portuguese',
      current_level: 'B1',
      learning_goals: [goal, ...interests.map((interest) => `interest:${interest}`)],
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/demo')
    router.refresh()
  }

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="onboard-shell">
      <div className="onboard-top">
        <span className="onboard-logo">Lexuri</span>
        <span className="onboard-step-counter">Step {step} of {TOTAL_STEPS}</span>
      </div>

      <div className="onboard-progress-track">
        <div className="onboard-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="onboard-body">
        {step === 1 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Choose your English goal.</h1>
            <p className="onboard-desc">
              Lexuri will recommend real content and chunks that match why you are learning.
            </p>
            <div className="onboard-goals-grid">
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  className={`onboard-goal${goal === item.id ? ' selected' : ''}`}
                  onClick={() => setGoal(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Choose what you like to consume.</h1>
            <p className="onboard-desc">
              Your first lessons should feel like something you would actually watch or listen to.
            </p>
            <div className="onboard-options-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  className={`onboard-option${interests.includes(interest) ? ' selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Your first lesson is ready.</h1>
            <p className="onboard-desc">
              Lexuri will start with a guided demo so you can see AI chunks, save your first three expressions, and complete a tiny review before you reach the dashboard.
            </p>
            <div style={{ border: '1px solid var(--auth-border)', borderRadius: 16, padding: 18, marginBottom: 18, background: 'rgba(248,250,252,0.04)' }}>
              <div style={{ color: 'var(--auth-text)', fontWeight: 900, marginBottom: 8 }}>First mission</div>
              <div style={{ display: 'grid', gap: 8, color: 'var(--auth-muted)', fontSize: '0.86rem' }}>
                <span>1. Reveal the AI chunk map</span>
                <span>2. Save three useful chunks</span>
                <span>3. Generate your first cards</span>
                <span>4. Review them once</span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {recommendedLessons.slice(0, 3).map((lesson) => (
                <div key={lesson.title} className="onboard-summary-row" style={{ border: '1px solid var(--auth-border)', borderRadius: 12 }}>
                  <span className="onboard-summary-key">{lesson.source}</span>
                  <span className="onboard-summary-val">{lesson.title}</span>
                </div>
              ))}
            </div>
            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        <div className="onboard-nav">
          {step > 1 && (
            <button className="onboard-btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button className="onboard-btn-primary" onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button className="onboard-btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? <><span className="auth-spinner" />Saving...</> : 'Start guided lesson'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
