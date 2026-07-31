import 'server-only'
import type {
  PronunciationPhoneme,
  PronunciationResult,
  PronunciationScores,
  PronunciationWord,
} from '@/lib/music/types'

interface AzureAssessment {
  AccuracyScore?: number
  FluencyScore?: number
  CompletenessScore?: number
  ProsodyScore?: number
  PronScore?: number
  ErrorType?: string
}

interface AzureWord {
  Word?: string
  PronunciationAssessment?: AzureAssessment
  Phonemes?: Array<{
    Phoneme?: string
    PronunciationAssessment?: AzureAssessment
  }>
}

interface AzureCandidate {
  Display?: string
  Lexical?: string
  PronunciationAssessment?: AzureAssessment
  Words?: AzureWord[]
}

interface AzureResponse {
  RecognitionStatus?: string
  DisplayText?: string
  NBest?: AzureCandidate[]
}

function finiteScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : null
}

export function isAzureSpeechConfigured(): boolean {
  return Boolean(
    process.env.AZURE_SPEECH_KEY
    && (process.env.AZURE_SPEECH_ENDPOINT || process.env.AZURE_SPEECH_REGION),
  )
}

function endpointUrl(locale: string): string {
  const configuredEndpoint = process.env.AZURE_SPEECH_ENDPOINT?.trim().replace(/\/+$/, '')
  const path = '/stt/speech/recognition/conversation/cognitiveservices/v1'

  if (configuredEndpoint) {
    const endpoint = new URL(configuredEndpoint)
    if (endpoint.protocol !== 'https:') throw new Error('AZURE_SPEECH_ENDPOINT must use HTTPS.')
    return `${endpoint.origin}${path}?language=${encodeURIComponent(locale)}&format=detailed&profanity=raw`
  }

  const region = process.env.AZURE_SPEECH_REGION?.trim().toLowerCase()
  if (!region || !/^[a-z0-9-]+$/.test(region)) {
    throw new Error('AZURE_SPEECH_REGION is invalid.')
  }
  return `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(locale)}&format=detailed&profanity=raw`
}

function feedbackFor(scores: PronunciationScores, focusWords: PronunciationWord[]): string {
  const overall = scores.pronunciation ?? scores.accuracy ?? 0
  const intro = overall >= 85
    ? 'Ótima clareza. Sua pronúncia ficou fácil de entender.'
    : overall >= 70
      ? 'Bom trabalho. A mensagem está clara, com alguns sons para ajustar.'
      : 'Vamos treinar este trecho mais devagar antes de cantar.'

  if (focusWords.length === 0) return `${intro} Você pode avançar para a gravação cantada.`

  const targets = focusWords.slice(0, 3).map((word) => {
    const weakPhonemes = word.phonemes
      .filter((phoneme) => phoneme.accuracy !== null && phoneme.accuracy < 70)
      .slice(0, 2)
      .map((phoneme) => `/${phoneme.phoneme}/`)
    return weakPhonemes.length > 0
      ? `${word.word} (${weakPhonemes.join(', ')})`
      : word.word
  })

  return `${intro} Repita especialmente: ${targets.join(', ')}.`
}

export function normalizeAzureAssessment(payload: AzureResponse): PronunciationResult {
  if (payload.RecognitionStatus && payload.RecognitionStatus !== 'Success') {
    throw new Error(`Azure Speech did not recognize the recording (${payload.RecognitionStatus}).`)
  }

  const candidate = payload.NBest?.[0]
  if (!candidate) throw new Error('Azure Speech returned no pronunciation candidate.')

  const assessment = candidate.PronunciationAssessment ?? {}
  const scores: PronunciationScores = {
    accuracy: finiteScore(assessment.AccuracyScore),
    fluency: finiteScore(assessment.FluencyScore),
    completeness: finiteScore(assessment.CompletenessScore),
    prosody: finiteScore(assessment.ProsodyScore),
    pronunciation: finiteScore(assessment.PronScore),
  }

  const words: PronunciationWord[] = (candidate.Words ?? []).map((word) => {
    const wordAssessment = word.PronunciationAssessment ?? {}
    const phonemes: PronunciationPhoneme[] = (word.Phonemes ?? []).map((phoneme) => ({
      phoneme: String(phoneme.Phoneme ?? ''),
      accuracy: finiteScore(phoneme.PronunciationAssessment?.AccuracyScore),
    })).filter((phoneme) => phoneme.phoneme.length > 0)

    return {
      word: String(word.Word ?? ''),
      accuracy: finiteScore(wordAssessment.AccuracyScore),
      errorType: String(wordAssessment.ErrorType ?? 'None'),
      phonemes,
    }
  }).filter((word) => word.word.length > 0)

  const focusWords = words.filter((word) =>
    word.errorType !== 'None' || (word.accuracy !== null && word.accuracy < 75),
  )

  return {
    recognizedText: candidate.Display ?? payload.DisplayText ?? candidate.Lexical ?? '',
    scores,
    words,
    focusWords,
    feedback: feedbackFor(scores, focusWords),
  }
}

export async function assessPronunciation(
  audio: ArrayBuffer,
  referenceText: string,
  locale = 'en-US',
): Promise<PronunciationResult> {
  const key = process.env.AZURE_SPEECH_KEY?.trim()
  if (!key || !isAzureSpeechConfigured()) {
    throw new Error('Azure Speech is not configured.')
  }

  const enableProsody = locale === 'en-US' && process.env.AZURE_SPEECH_PROSODY === 'true'
  const assessmentConfig = {
    ReferenceText: referenceText.replace(/\s+/g, ' ').trim(),
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
    EnableProsodyAssessment: enableProsody ? 'True' : 'False',
  }
  const pronunciationHeader = Buffer
    .from(JSON.stringify(assessmentConfig), 'utf8')
    .toString('base64')

  const response = await fetch(endpointUrl(locale), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Ocp-Apim-Subscription-Key': key,
      'Pronunciation-Assessment': pronunciationHeader,
    },
    body: audio,
    cache: 'no-store',
    signal: AbortSignal.timeout(35_000),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Azure Speech error ${response.status}: ${raw.slice(0, 300)}`)
  }

  let payload: AzureResponse
  try {
    payload = JSON.parse(raw) as AzureResponse
  } catch {
    throw new Error('Azure Speech returned invalid JSON.')
  }
  return normalizeAzureAssessment(payload)
}

