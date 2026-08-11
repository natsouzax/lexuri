export interface GlossaryExample {
  id: string
  takeaway_id: string
  target_expression: string
  question: string
  answer: string
  original_answer: string | null
  feedback: string | null
  created_at: string
}

export interface GlossaryPracticeState {
  takeaway_id: string
  target_expression?: string | null
  repetitions: number
  interval_days: number
  next_review_at: string
  last_reviewed_at: string | null
}

export interface GlossaryPracticeTarget {
  id: string
  text: string
  song_id: string
  created_at: string
}

export interface GlossaryPracticePrompt {
  takeawayId: string
  expression: string
  question: string
  instruction: string
}

export interface GlossaryAssessment {
  accepted: boolean
  usesTarget: boolean
  isComplete: boolean
  isRelevant: boolean
  feedback: string
  suggestion: string | null
}

export function normalizePracticeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function deriveTargetExpression(takeaway: string): string {
  const clean = takeaway.trim().replace(/^\d+[.)]\s*/, '')
  const quoted = clean.match(/[“"]([^”"]{1,120})[”"]/)?.[1]?.trim()
  if (quoted) return quoted

  const beforeDefinition = clean.split(/\s+(?:=|means?|significa)\s+/i)[0]?.trim()
  if (beforeDefinition && beforeDefinition.split(/\s+/).length <= 8 && beforeDefinition.length <= 120) {
    return beforeDefinition
  }

  const words = clean.split(/\s+/).filter(Boolean)
  return (words.length <= 8 ? clean : words.slice(0, 8).join(' ')).slice(0, 120)
}

export function expressionBelongsToTakeaway(expression: string, takeaway: string): boolean {
  const normalizedExpression = normalizePracticeText(expression)
  return normalizedExpression.length > 0
    && normalizePracticeText(takeaway).includes(normalizedExpression)
}

export function answerUsesExpression(answer: string, expression: string): boolean {
  const normalizedAnswer = ` ${normalizePracticeText(answer)} `
  const normalizedExpression = normalizePracticeText(expression)
  return normalizedExpression.length > 0 && normalizedAnswer.includes(` ${normalizedExpression} `)
}

export function isLikelyCompleteAnswer(answer: string, expression: string): boolean {
  const answerWords = normalizePracticeText(answer).split(' ').filter(Boolean)
  const expressionWords = normalizePracticeText(expression).split(' ').filter(Boolean)
  return answerWords.length >= Math.max(4, expressionWords.length + 1)
}

export function nextGlossaryIntervalDays(repetitions: number): number {
  const intervals = [3, 7, 14, 30, 60]
  return intervals[Math.min(Math.max(0, repetitions), intervals.length - 1)]
}

export function selectGlossaryPracticeTarget(
  takeaways: GlossaryPracticeTarget[],
  states: GlossaryPracticeState[],
  now = new Date(),
  requestedId?: string | null,
): GlossaryPracticeTarget | null {
  const byTakeaway = new Map(states.map((state) => [state.takeaway_id, state]))

  if (requestedId) {
    const requested = takeaways.find((takeaway) => takeaway.id === requestedId)
    if (requested) return requested
  }

  const unseen = takeaways.find((takeaway) => !byTakeaway.has(takeaway.id))
  if (unseen) return unseen

  return takeaways
    .filter((takeaway) => {
      const state = byTakeaway.get(takeaway.id)
      return state && new Date(state.next_review_at).getTime() <= now.getTime()
    })
    .sort((a, b) => {
      const aDue = byTakeaway.get(a.id)?.next_review_at ?? a.created_at
      const bDue = byTakeaway.get(b.id)?.next_review_at ?? b.created_at
      return new Date(aDue).getTime() - new Date(bDue).getTime()
    })[0] ?? null
}
