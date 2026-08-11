import type { ActionEvent } from '@/lib/gamification'

export const XP_AWARDED_EVENT = 'lexuri:xp-awarded'

export interface XPAwardResult {
  points: number
  newTotal: number
  badgesAwarded: string[]
  missionsCompleted?: string[]
  duplicate?: boolean
  capped?: boolean
}

export interface XPAwardDetail extends XPAwardResult {
  event: ActionEvent | 'flashcard_review'
}

export function announceXP(event: XPAwardDetail['event'], result?: XPAwardResult | null) {
  if (!result || result.points <= 0 || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<XPAwardDetail>(XP_AWARDED_EVENT, {
    detail: { event, ...result },
  }))
}

export async function awardXP(
  event: ActionEvent,
  eventId?: string,
  metadata?: Record<string, unknown>,
): Promise<XPAwardResult | null> {
  try {
    const response = await fetch('/api/gamification/award-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, eventId, metadata }),
    })
    const result = await response.json() as XPAwardResult
    if (!response.ok) return null
    announceXP(event, result)
    return result
  } catch {
    return null
  }
}
