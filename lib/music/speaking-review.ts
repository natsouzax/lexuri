export interface SpeakingReviewScheduleInput {
  easeFactor: number
  intervalDays: number
  repetitions: number
}

export interface SpeakingReviewSchedule extends SpeakingReviewScheduleInput {
  nextReviewAt: Date
}

export function normalizeSpeakingTarget(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g)
    ?.join(' ')
    .toLowerCase() ?? ''
}

export function isEquivalentEnglishTranscription(
  expected: string,
  recognized: string,
): boolean {
  const expectedNormalized = normalizeSpeakingTarget(expected)
  const recognizedNormalized = normalizeSpeakingTarget(recognized)
  if (!expectedNormalized || !recognizedNormalized) return false
  if (expectedNormalized === recognizedNormalized) return true
  if (expectedNormalized.includes(' ') || recognizedNormalized.includes(' ')) return false

  // Speech-to-text can omit the silent H in Greek-origin English spellings
  // (for example rhythm -> rythm). That is a spelling difference in the
  // transcript, not evidence that the spoken sound was misunderstood.
  const phoneticSpelling = (word: string) => word.replace(/rh/g, 'r')
  return phoneticSpelling(expectedNormalized) === phoneticSpelling(recognizedNormalized)
}

export function nextSpeakingReview(
  current: SpeakingReviewScheduleInput,
  understood: boolean,
  clarityScore: number | null,
  now = new Date(),
): SpeakingReviewSchedule {
  if (!understood) {
    return {
      easeFactor: Math.max(1.3, current.easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: now,
    }
  }

  const repetitions = current.repetitions + 1
  const intervalDays = current.repetitions === 0
    ? 1
    : current.repetitions === 1
      ? 3
      : current.repetitions === 2
        ? 7
        : Math.min(60, Math.max(1, Math.round(current.intervalDays * current.easeFactor)))
  const scoreAdjustment = clarityScore !== null && clarityScore >= 90
    ? 0.1
    : clarityScore !== null && clarityScore < 75
      ? -0.05
      : 0
  const easeFactor = Math.max(1.3, Math.min(3.5, current.easeFactor + scoreAdjustment))

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000),
  }
}
