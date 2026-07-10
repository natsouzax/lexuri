'use client'

import DuoOption from '@/components/ui/DuoOption'

const INTERESTS = ['Technology', 'Business', 'Science', 'Sports', 'Music', 'Movies']

interface InterestsStepProps {
  interests: string[]
  onToggle: (interest: string) => void
  error?: string
}

export default function InterestsStep({ interests, onToggle, error }: InterestsStepProps) {
  return (
    <div>
      <h1 className="onboard-title">Choose what you like to consume.</h1>
      <p className="onboard-desc">
        Your first lessons should feel like something you would actually watch or listen to.
      </p>
      <div className="onboard-options-grid">
        {INTERESTS.map((interest) => (
          <DuoOption
            key={interest}
            selected={interests.includes(interest)}
            onSelect={() => onToggle(interest)}
            label={interest}
          />
        ))}
      </div>
      {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  )
}
