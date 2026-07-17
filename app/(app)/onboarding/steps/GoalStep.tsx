'use client'

import DuoOption from '@/components/ui/DuoOption'

const GOALS = [
  { id: 'travel', label: 'Travel' },
  { id: 'work', label: 'Work' },
  { id: 'fluency', label: 'Fluency' },
  { id: 'exams', label: 'Exams' },
  { id: 'conversation', label: 'Daily Conversation' },
]

interface GoalStepProps {
  goal: string
  onSelect: (goal: string) => void
}

export default function GoalStep({ goal, onSelect }: GoalStepProps) {
  return (
    <div>
      <h1 className="onboard-title">Choose your English goal.</h1>
      <p className="onboard-desc">
        Lexuri will recommend real content and chunks that match why you are learning.
      </p>
      <div className="onboard-goals-grid">
        {GOALS.map((item) => (
          <DuoOption
            key={item.id}
            variant="goal"
            selected={goal === item.id}
            onSelect={() => onSelect(item.id)}
            label={item.label}
          />
        ))}
      </div>
    </div>
  )
}
