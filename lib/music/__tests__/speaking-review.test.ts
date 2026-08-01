import { describe, expect, it } from 'vitest'
import {
  isEquivalentEnglishTranscription,
  nextSpeakingReview,
  normalizeSpeakingTarget,
} from '@/lib/music/speaking-review'

describe('normalizeSpeakingTarget', () => {
  it('normalizes case, punctuation, curly apostrophes, and accents', () => {
    expect(normalizeSpeakingTarget('  Don’t, Café! ')).toBe("don't cafe")
  })
})

describe('nextSpeakingReview', () => {
  const now = new Date('2026-08-01T12:00:00.000Z')

  it('schedules the first understood attempt for tomorrow', () => {
    const result = nextSpeakingReview({ easeFactor: 2.5, intervalDays: 0, repetitions: 0 }, true, 92, now)
    expect(result.repetitions).toBe(1)
    expect(result.intervalDays).toBe(1)
    expect(result.easeFactor).toBe(2.6)
    expect(result.nextReviewAt.toISOString()).toBe('2026-08-02T12:00:00.000Z')
  })

  it('keeps a misunderstood word due for an immediate retry', () => {
    const result = nextSpeakingReview({ easeFactor: 2.5, intervalDays: 7, repetitions: 3 }, false, 40, now)
    expect(result).toEqual({
      easeFactor: 2.3,
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: now,
    })
  })
})

describe('isEquivalentEnglishTranscription', () => {
  it('accepts an omitted silent h in rhythm as a transcription spelling variation', () => {
    expect(isEquivalentEnglishTranscription('rhythm', 'Rythm')).toBe(true)
  })

  it('does not accept a different English word', () => {
    expect(isEquivalentEnglishTranscription('through', 'though')).toBe(false)
  })
})
