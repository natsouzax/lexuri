import { describe, expect, it } from 'vitest'
import {
  answerUsesExpression,
  deriveTargetExpression,
  expressionBelongsToTakeaway,
  isLikelyCompleteAnswer,
  nextGlossaryIntervalDays,
  selectGlossaryPracticeTarget,
  type GlossaryPracticeState,
  type GlossaryPracticeTarget,
} from '@/lib/glossary-practice'

const takeaways: GlossaryPracticeTarget[] = [
  { id: 'a', text: 'breaking point', song_id: 'roar', created_at: '2026-08-01T00:00:00.000Z' },
  { id: 'b', text: 'roar', song_id: 'roar', created_at: '2026-08-02T00:00:00.000Z' },
]

describe('glossary personal practice', () => {
  it('requires the target expression and enough context for the exercise', () => {
    expect(answerUsesExpression('My breaking point is when people shout.', 'breaking point')).toBe(true)
    expect(answerUsesExpression('I dislike shouting.', 'breaking point')).toBe(false)
    expect(isLikelyCompleteAnswer('Yes, I do.', 'have a car')).toBe(false)
    expect(isLikelyCompleteAnswer('Yes, I have a car.', 'have a car')).toBe(true)
  })

  it('extracts a concise target from common Glossary formats', () => {
    expect(deriveTargetExpression('"by the way" = incidentally')).toBe('by the way')
    expect(deriveTargetExpression('breaking point')).toBe('breaking point')
    expect(expressionBelongsToTakeaway('by the way', '"by the way" = incidentally')).toBe(true)
  })

  it('prioritizes an expression that has never received a personal example', () => {
    const states: GlossaryPracticeState[] = [{
      takeaway_id: 'a',
      repetitions: 1,
      interval_days: 3,
      next_review_at: '2026-08-01T00:00:00.000Z',
      last_reviewed_at: '2026-07-29T00:00:00.000Z',
    }]
    expect(selectGlossaryPracticeTarget(takeaways, states, new Date('2026-08-07T00:00:00.000Z'))?.id).toBe('b')
  })

  it('returns the oldest due expression after every item has an example', () => {
    const states: GlossaryPracticeState[] = [
      { takeaway_id: 'a', repetitions: 1, interval_days: 3, next_review_at: '2026-08-05T00:00:00.000Z', last_reviewed_at: null },
      { takeaway_id: 'b', repetitions: 1, interval_days: 3, next_review_at: '2026-08-04T00:00:00.000Z', last_reviewed_at: null },
    ]
    expect(selectGlossaryPracticeTarget(takeaways, states, new Date('2026-08-07T00:00:00.000Z'))?.id).toBe('b')
  })

  it('uses increasingly spaced intervals', () => {
    expect([0, 1, 2, 3, 8].map(nextGlossaryIntervalDays)).toEqual([3, 7, 14, 30, 60])
  })
})
