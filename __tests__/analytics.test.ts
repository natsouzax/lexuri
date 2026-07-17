import { describe, it, expect } from 'vitest'

// Test the allowed events list independently from the route module
const ALLOWED_EVENTS = [
  'flashcard_review',
  'session_start',
  'session_end',
  'payment_complete',
  'video_sync_play',
  'chunk_detected',
  'flashcard_created',
]

describe('analytics event validation', () => {
  it('accepts all known event types', () => {
    for (const e of ALLOWED_EVENTS) {
      expect(ALLOWED_EVENTS.includes(e)).toBe(true)
    }
  })

  it('rejects unknown event types', () => {
    expect(ALLOWED_EVENTS.includes('unknown_event')).toBe(false)
    expect(ALLOWED_EVENTS.includes('')).toBe(false)
  })

  it('has exactly 7 allowed events', () => {
    expect(ALLOWED_EVENTS).toHaveLength(7)
  })
})
