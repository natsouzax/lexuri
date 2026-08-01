import { describe, expect, it } from 'vitest'
import { countSpeechWords, evaluateIntelligibility } from '@/lib/music/intelligibility'

describe('speech intelligibility assessment', () => {
  it('gives a high clarity score when every word is understood', () => {
    const result = evaluateIntelligibility(
      'I thought about you today',
      'I thought about you today.',
      [{ token: ' thought', logprob: Math.log(0.95) }],
    )

    expect(result.scores.accuracy).toBe(100)
    expect(result.scores.completeness).toBe(100)
    expect(result.scores.pronunciation).toBeGreaterThan(99)
    expect(result.focusWords).toEqual([])
  })

  it('identifies substituted and omitted reference words', () => {
    const result = evaluateIntelligibility(
      'I thought about you today',
      'I taught you today',
    )

    expect(result.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ word: 'thought', recognizedWord: 'taught', errorType: 'Substitution' }),
      expect.objectContaining({ word: 'about', recognizedWord: null, errorType: 'Omission' }),
    ]))
    expect(result.scores.accuracy).toBe(60)
    expect(result.feedback).toContain('“thought” foi entendida como “taught”')
    expect(result.feedback).toContain('“about” não foi reconhecida')
  })

  it('treats curly and straight apostrophes as the same word', () => {
    const result = evaluateIntelligibility('I’m ready', "I'm ready")
    expect(result.scores.accuracy).toBe(100)
    expect(result.focusWords).toHaveLength(0)
  })

  it('returns actionable feedback when no speech is understood', () => {
    const result = evaluateIntelligibility('Keep going', '')
    expect(result.scores.pronunciation).toBe(0)
    expect(result.words.every((word) => word.errorType === 'Omission')).toBe(true)
    expect(result.feedback).toContain('não conseguiu entender')
  })

  it('uses whole-song feedback after a complete performance', () => {
    const result = evaluateIntelligibility(
      'Keep moving through the night',
      'Keep moving the night',
      [],
      'song',
    )

    expect(result.feedback).toContain('performance')
    expect(result.feedback).toContain('“through” não foi reconhecida')
  })

  it('counts the reference words used to split the final result by section', () => {
    expect(countSpeechWords("I'm ready — let’s go!")).toBe(4)
  })
})
