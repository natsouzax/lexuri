'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { LANG_DB_NAME } from '@/lib/languages'
import { getOnboardingCopy } from '@/lib/onboarding-i18n'
import { playTap, playSuccess } from '@/lib/sfx'
import StepShell from './StepShell'
import WelcomeStep from './steps/WelcomeStep'
import LanguageStep from './steps/LanguageStep'
import GoalStep from './steps/GoalStep'
import InterestsStep from './steps/InterestsStep'
import LevelQuizStep from './steps/LevelQuizStep'
import LevelRevealStep from './steps/LevelRevealStep'
import SpotifyStep from './steps/SpotifyStep'
import GuidedPracticeStep from './steps/GuidedPracticeStep'
import SummaryStep from './steps/SummaryStep'

type StepId = 'welcome' | 'language' | 'goal' | 'interests' | 'quiz' | 'reveal' | 'spotify' | 'practice' | 'summary'

const STEP_ORDER: StepId[] = ['welcome', 'language', 'goal', 'interests', 'quiz', 'reveal', 'spotify', 'practice', 'summary']

const STORAGE_KEY = 'lexuri_onboarding_progress'

interface StoredProgress {
  stepIndex?: number
  nativeLang?: string | null
  goal?: string
  interests?: string[]
  level?: string | null
}

export default function OnboardingPage() {
  const router = useRouter()

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [nativeLang, setNativeLang] = useState<string | null>(null)
  const [goal, setGoal] = useState('fluency')
  const [interests, setInterests] = useState<string[]>(['Technology', 'Music'])
  const [level, setLevel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Restore progress (e.g. after the Spotify OAuth redirect round-trip).
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved: StoredProgress = JSON.parse(raw)
      if (typeof saved.stepIndex === 'number') setStepIndex(saved.stepIndex)
      if (saved.nativeLang) setNativeLang(saved.nativeLang)
      if (saved.goal) setGoal(saved.goal)
      if (Array.isArray(saved.interests)) setInterests(saved.interests)
      if (saved.level) setLevel(saved.level)
    } catch {
      // corrupt/old payload — ignore and start fresh
    }
  }, [])

  useEffect(() => {
    const payload: StoredProgress = { stepIndex, nativeLang, goal, interests, level }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [stepIndex, nativeLang, goal, interests, level])

  const currentStepId = STEP_ORDER[stepIndex]
  const copy = getOnboardingCopy(nativeLang)
  const progressPct = (stepIndex / (STEP_ORDER.length - 1)) * 100

  function goNext() {
    playTap()
    setDirection(1)
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1))
  }

  function goBack() {
    playTap()
    setDirection(-1)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function toggleInterest(label: string) {
    setInterests((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  async function handleFinish() {
    playSuccess()
    setError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: dbError } = await supabase.from('onboarding').upsert({
      user_id: user.id,
      native_language: nativeLang ? LANG_DB_NAME[nativeLang] : 'Unknown',
      current_level: level ?? 'A1',
      learning_goals: [goal, ...interests.map((interest) => `interest:${interest}`)],
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    sessionStorage.removeItem(STORAGE_KEY)
    router.push('/dashboard')
    router.refresh()
  }

  function renderStep(id: StepId) {
    switch (id) {
      case 'welcome':
        return <WelcomeStep copy={copy} />
      case 'language':
        return <LanguageStep nativeLang={nativeLang} onSelect={setNativeLang} />
      case 'goal':
        return <GoalStep goal={goal} onSelect={setGoal} />
      case 'interests':
        return <InterestsStep interests={interests} onToggle={toggleInterest} />
      case 'quiz':
        return <LevelQuizStep copy={copy} onComplete={(lvl) => { setLevel(lvl); goNext() }} />
      case 'reveal':
        return <LevelRevealStep level={level ?? 'A1'} copy={copy} />
      case 'spotify':
        return <SpotifyStep copy={copy} onSkip={goNext} />
      case 'practice':
        return <GuidedPracticeStep copy={copy} />
      case 'summary':
        return <SummaryStep error={error} />
    }
  }

  const continueConfig: { label: string; disabled: boolean; onClick: () => void } | null = (() => {
    switch (currentStepId) {
      case 'welcome': return { label: "Let's start", disabled: false, onClick: goNext }
      case 'language': return { label: 'Continue', disabled: !nativeLang, onClick: goNext }
      case 'goal': return { label: 'Continue', disabled: false, onClick: goNext }
      case 'interests': return { label: 'Continue', disabled: interests.length === 0, onClick: goNext }
      case 'reveal': return { label: 'Continue', disabled: false, onClick: goNext }
      case 'practice': return { label: 'Continue', disabled: false, onClick: goNext }
      case 'summary': return { label: saving ? 'Saving...' : "Let's go!", disabled: saving, onClick: handleFinish }
      default: return null // 'quiz' and 'spotify' are self-contained and advance themselves
    }
  })()

  const showBack = continueConfig !== null && stepIndex > 0

  return (
    <div className="onboard-shell">
      <div className="onboard-top">
        <span className="onboard-logo">Lexuri</span>
        <span className="onboard-step-counter">Step {stepIndex + 1} of {STEP_ORDER.length}</span>
      </div>

      <div className="onboard-progress-track">
        <div className="onboard-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="onboard-body">
        <StepShell stepKey={currentStepId} direction={direction}>
          {renderStep(currentStepId)}
        </StepShell>

        {continueConfig && (
          <div className="onboard-nav">
            {showBack && (
              <button className="onboard-btn-secondary" onClick={goBack} disabled={saving}>
                Back
              </button>
            )}
            <button className="onboard-btn-primary" onClick={continueConfig.onClick} disabled={continueConfig.disabled}>
              {continueConfig.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
