import type { Flashcard } from './types'

export interface SRSCard {
  id: string
  word: string
  definition: string
  translation: string
  example: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review: Date
  last_reviewed: Date | null
}

export function flashcardToSRSCard(card: Flashcard): SRSCard {
  return {
    id: card.id,
    word: card.word,
    definition: card.explanation,
    translation: card.translation,
    example: card.example,
    ease_factor: card.ease_factor,
    interval: card.interval,
    repetitions: card.repetitions,
    next_review: new Date(card.next_review),
    last_reviewed: card.last_reviewed ? new Date(card.last_reviewed) : null,
  }
}

export function updateCard(card: SRSCard, quality: number): SRSCard {
  quality = Math.min(5, Math.max(0, Math.floor(quality)))
  const updated = { ...card }

  if (quality < 3) {
    updated.repetitions = 0
    updated.interval = 1
  } else {
    if (updated.repetitions === 0) {
      updated.interval = 1
    } else if (updated.repetitions === 1) {
      updated.interval = 6
    } else {
      updated.interval = Math.max(1, Math.floor(updated.interval * updated.ease_factor))
    }
    updated.repetitions += 1
  }

  updated.ease_factor =
    updated.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  updated.ease_factor = Math.max(updated.ease_factor, 1.3)

  const now = new Date()
  updated.last_reviewed = now
  updated.next_review = new Date(now.getTime() + updated.interval * 24 * 60 * 60 * 1000)

  return updated
}

export function getDueCards(cards: Flashcard[]): SRSCard[] {
  const now = new Date()
  return cards
    .filter((card) => new Date(card.next_review) <= now)
    .map(flashcardToSRSCard)
}
