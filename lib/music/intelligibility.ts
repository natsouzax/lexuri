import type {
  PronunciationResult,
  PronunciationScores,
  PronunciationWord,
} from '@/lib/music/types'

export interface TranscriptionLogprob {
  token?: string
  logprob?: number
}

interface SpeechToken {
  display: string
  normalized: string
}

type AlignmentStep =
  | { type: 'match'; reference: SpeechToken; recognized: SpeechToken }
  | { type: 'substitution'; reference: SpeechToken; recognized: SpeechToken }
  | { type: 'omission'; reference: SpeechToken }
  | { type: 'insertion'; recognized: SpeechToken }

function roundScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 100) / 100
}

function tokenize(text: string): SpeechToken[] {
  const canonical = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘`]/g, "'")
  const words = canonical.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g) ?? []
  return words.map((word) => ({ display: word, normalized: word.toLowerCase() }))
}

export function countSpeechWords(text: string): number {
  return tokenize(text).length
}

function editDistance(left: string[], right: string[]): number {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  )
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = matrix[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      matrix[i][j] = Math.min(
        substitution,
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
      )
    }
  }
  return matrix[left.length][right.length]
}

function wordSimilarity(reference: string, recognized: string): number {
  const longest = Math.max(reference.length, recognized.length)
  if (longest === 0) return 0
  return 1 - editDistance(Array.from(reference), Array.from(recognized)) / longest
}

function alignmentSubstitutionCost(reference: SpeechToken, recognized: SpeechToken): number {
  if (reference.normalized === recognized.normalized) return 0
  return 1 - Math.max(0, wordSimilarity(reference.normalized, recognized.normalized)) * 0.25
}

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000_001
}

function alignWords(reference: SpeechToken[], recognized: SpeechToken[]): AlignmentStep[] {
  const matrix = Array.from({ length: reference.length + 1 }, () =>
    Array<number>(recognized.length + 1).fill(0),
  )
  for (let i = 0; i <= reference.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= recognized.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= reference.length; i += 1) {
    for (let j = 1; j <= recognized.length; j += 1) {
      const substitution = matrix[i - 1][j - 1]
        + alignmentSubstitutionCost(reference[i - 1], recognized[j - 1])
      matrix[i][j] = Math.min(
        substitution,
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
      )
    }
  }

  const reversed: AlignmentStep[] = []
  let i = reference.length
  let j = recognized.length
  while (i > 0 || j > 0) {
    if (
      i > 0
      && j > 0
      && reference[i - 1].normalized === recognized[j - 1].normalized
      && approximatelyEqual(matrix[i][j], matrix[i - 1][j - 1])
    ) {
      reversed.push({ type: 'match', reference: reference[i - 1], recognized: recognized[j - 1] })
      i -= 1
      j -= 1
    } else if (
      i > 0
      && j > 0
      && approximatelyEqual(
        matrix[i][j],
        matrix[i - 1][j - 1] + alignmentSubstitutionCost(reference[i - 1], recognized[j - 1]),
      )
    ) {
      reversed.push({ type: 'substitution', reference: reference[i - 1], recognized: recognized[j - 1] })
      i -= 1
      j -= 1
    } else if (i > 0 && approximatelyEqual(matrix[i][j], matrix[i - 1][j] + 1)) {
      reversed.push({ type: 'omission', reference: reference[i - 1] })
      i -= 1
    } else {
      reversed.push({ type: 'insertion', recognized: recognized[j - 1] })
      j -= 1
    }
  }
  return reversed.reverse()
}

function substitutionScore(reference: string, recognized: string): number {
  return roundScore(Math.min(70, Math.max(0, wordSimilarity(reference, recognized)) * 100))
}

function transcriptionConfidence(logprobs: TranscriptionLogprob[]): number | null {
  const probabilities = logprobs.flatMap((item) => {
    if (
      typeof item.logprob !== 'number'
      || !Number.isFinite(item.logprob)
      || !item.token
      || !/[A-Za-z0-9]/.test(item.token)
    ) return []
    return [Math.exp(Math.min(0, item.logprob)) * 100]
  })
  if (probabilities.length === 0) return null
  return roundScore(probabilities.reduce((sum, value) => sum + value, 0) / probabilities.length)
}

function buildFeedback(
  clarity: number,
  recognizedCount: number,
  focusWords: PronunciationWord[],
  insertedWords: string[],
  scope: 'section' | 'song',
): string {
  if (recognizedCount === 0) {
    return scope === 'song'
      ? 'A IA não conseguiu entender a performance. Aproxime-se do microfone e tente cantar mais devagar.'
      : 'A IA não conseguiu entender o trecho. Aproxime-se do microfone e repita mais devagar, sem o instrumental.'
  }

  const intro = scope === 'song'
    ? clarity >= 90
      ? 'Ótima performance. A IA entendeu a música com facilidade.'
      : clarity >= 75
        ? 'Boa performance. Algumas palavras ainda podem ficar mais claras.'
        : 'A IA entendeu partes da música. Vamos treinar os pontos destacados e gravar novamente.'
    : clarity >= 90
      ? 'Ótima clareza. A IA entendeu o trecho com facilidade.'
      : clarity >= 75
        ? 'Boa clareza. Algumas palavras ainda podem ficar mais fáceis de entender.'
        : 'Vamos repetir o trecho mais devagar antes de cantar.'

  const targets = focusWords.slice(0, 3).map((word) => {
    if (word.errorType === 'Omission') return `“${word.word}” não foi reconhecida`
    return `“${word.word}” foi entendida como “${word.recognizedWord ?? '?'}”`
  })
  const focus = targets.length > 0 ? ` Atenção: ${targets.join('; ')}.` : ''
  const extras = insertedWords.length > 0
    ? ` A IA também ouviu: ${insertedWords.slice(0, 3).map((word) => `“${word}”`).join(', ')}.`
    : ''
  const next = scope === 'song'
    ? focusWords.length === 0 && insertedWords.length === 0
      ? ' A música inteira ficou clara.'
      : ' Treine as palavras destacadas e tente uma nova performance.'
    : focusWords.length === 0 && insertedWords.length === 0
      ? ' Você pode avançar para a gravação cantada.'
      : ' Escute o modelo e tente novamente.'

  return `${intro}${focus}${extras}${next}`
}

export function evaluateIntelligibility(
  referenceText: string,
  recognizedText: string,
  logprobs: TranscriptionLogprob[] = [],
  scope: 'section' | 'song' = 'section',
): PronunciationResult {
  const reference = tokenize(referenceText)
  if (reference.length === 0) throw new Error('The song section has no words to assess.')

  const recognized = tokenize(recognizedText)
  const alignment = alignWords(reference, recognized)
  const matches = alignment.filter((step) => step.type === 'match').length
  const substitutions = alignment.filter((step) => step.type === 'substitution').length
  const omissions = alignment.filter((step) => step.type === 'omission').length
  const insertions = alignment.filter((step) => step.type === 'insertion')
  const denominator = Math.max(reference.length, recognized.length, 1)
  const sequenceAccuracy = roundScore(
    100 * (1 - (substitutions + omissions + insertions.length) / denominator),
  )
  const completeness = roundScore(100 * (matches + substitutions) / reference.length)
  const wordAccuracy = roundScore(100 * matches / reference.length)
  const confidence = transcriptionConfidence(logprobs)
  const clarity = roundScore(confidence === null
    ? sequenceAccuracy * 0.85 + completeness * 0.15
    : sequenceAccuracy * 0.75 + completeness * 0.15 + confidence * 0.1)

  const words = alignment.flatMap<PronunciationWord>((step): PronunciationWord[] => {
    if (step.type === 'insertion') return []
    if (step.type === 'match') {
      return [{
        word: step.reference.display,
        recognizedWord: step.recognized.display,
        accuracy: 100,
        errorType: 'None',
        phonemes: [],
      }]
    }
    if (step.type === 'substitution') {
      return [{
        word: step.reference.display,
        recognizedWord: step.recognized.display,
        accuracy: substitutionScore(step.reference.normalized, step.recognized.normalized),
        errorType: 'Substitution',
        phonemes: [],
      }]
    }
    return [{
      word: step.reference.display,
      recognizedWord: null,
      accuracy: 0,
      errorType: 'Omission',
      phonemes: [],
    }]
  })
  const focusWords = words.filter((word) => word.errorType !== 'None')
  const insertedWords = insertions.map((step) => step.recognized.display)
  const scores: PronunciationScores = {
    accuracy: wordAccuracy,
    fluency: null,
    completeness,
    prosody: null,
    pronunciation: clarity,
    confidence,
  }

  return {
    recognizedText: recognizedText.trim(),
    scores,
    words,
    focusWords,
    feedback: buildFeedback(clarity, recognized.length, focusWords, insertedWords, scope),
  }
}
