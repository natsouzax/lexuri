import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDueCards } from '@/lib/srs'
import { normalizeFlashcard } from '@/lib/types'

describe('new learning cards', () => {
  afterEach(() => vi.useRealTimers())

  it('puts a translated word or sentence into the review queue immediately', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-07T12:00:00.000Z'))

    const card = normalizeFlashcard({
      word: 'How are you?',
      translation: 'Como você está?',
      definition: 'A common greeting.',
      example: 'Hi, how are you?',
    })

    expect(card).not.toBeNull()
    expect(card?.word).toBe('how are you?')
    expect(getDueCards([card!])).toHaveLength(1)
    expect(card?.repetitions).toBe(0)
  })
})
