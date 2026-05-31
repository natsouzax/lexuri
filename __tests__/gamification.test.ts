import { describe, it, expect } from 'vitest'
import { calcReviewPoints, streakBonus } from '../lib/gamification'

describe('calcReviewPoints', () => {
  it('returns 0 for quality < 3', () => {
    expect(calcReviewPoints({ quality: 0 }).points).toBe(0)
    expect(calcReviewPoints({ quality: 2 }).points).toBe(0)
  })

  it('returns 10 base for quality 3', () => {
    expect(calcReviewPoints({ quality: 3 }).points).toBe(10)
  })

  it('applies 1.2x multiplier for quality 4', () => {
    expect(calcReviewPoints({ quality: 4 }).points).toBe(12)
  })

  it('applies 1.5x multiplier for quality 5', () => {
    expect(calcReviewPoints({ quality: 5 }).points).toBe(15)
  })

  it('adds 10% bonus for response < 10s', () => {
    const result = calcReviewPoints({ quality: 3, responseTimeSec: 5 })
    expect(result.points).toBe(11)
  })

  it('subtracts 20% for response > 60s', () => {
    const result = calcReviewPoints({ quality: 3, responseTimeSec: 90 })
    expect(result.points).toBe(8)
  })

  it('no time modifier for 10-60s response', () => {
    expect(calcReviewPoints({ quality: 3, responseTimeSec: 30 }).points).toBe(10)
  })

  it('combines quality multiplier and speed bonus', () => {
    // quality 5 → 15, then <10s +10% → 16 (rounded)
    expect(calcReviewPoints({ quality: 5, responseTimeSec: 5 }).points).toBe(17)
  })
})

describe('streakBonus', () => {
  it('returns 0 for streak < 7', () => {
    expect(streakBonus(6)).toBe(0)
  })

  it('returns 50 for 7-day streak', () => {
    expect(streakBonus(7)).toBe(50)
    expect(streakBonus(13)).toBe(50)
  })

  it('returns 100 for 14-day streak', () => {
    expect(streakBonus(14)).toBe(100)
    expect(streakBonus(29)).toBe(100)
  })

  it('returns 250 for 30-day streak', () => {
    expect(streakBonus(30)).toBe(250)
    expect(streakBonus(100)).toBe(250)
  })
})
