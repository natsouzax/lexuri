import 'server-only'
import { toFile } from 'openai'
import { getOpenAIClient } from '@/lib/openai'
import { evaluateIntelligibility } from '@/lib/music/intelligibility'
import type { PronunciationResult } from '@/lib/music/types'

const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe'
const SUPPORTED_NATIVE_LANGUAGES = new Set([
  'English',
  'Brazilian Portuguese',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Chinese (Simplified)',
  'Arabic',
  'Turkish',
  'Russian',
  'Hindi',
])

interface SpeechAssessmentOptions {
  filename?: string
  mimeType?: string
  timeoutMs?: number
  scope?: 'section' | 'song'
  nativeLanguage?: string
}

function englishTranscriptionContext(nativeLanguage?: string): string {
  const safeNativeLanguage = nativeLanguage
    && SUPPORTED_NATIVE_LANGUAGES.has(nativeLanguage)
    && nativeLanguage !== 'English'
    ? nativeLanguage
    : null
  return [
    'The speaker is an English learner speaking or singing only in English.',
    safeNativeLanguage
      ? `Their native language is ${safeNativeLanguage}; account for natural ${safeNativeLanguage} accent patterns while recognizing the English speech.`
      : '',
    'Transcribe only the English words actually heard, using standard English spelling.',
    'Do not translate or switch the transcript into another language.',
  ].filter(Boolean).join(' ')
}

export class SpeechAnalysisServiceError extends Error {
  constructor() {
    super('The voice analysis service is temporarily unavailable. Try again in a moment.')
    this.name = 'SpeechAnalysisServiceError'
  }
}

export function isSpeechAnalysisConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

export async function assessSpeechIntelligibility(
  audio: ArrayBuffer,
  referenceText: string,
  locale = 'en-US',
  options: SpeechAssessmentOptions = {},
): Promise<PronunciationResult> {
  if (!isSpeechAnalysisConfigured()) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  try {
    const language = locale.split('-')[0].toLowerCase()
    const file = await toFile(Buffer.from(audio), options.filename ?? 'practice.wav', {
      type: options.mimeType ?? 'audio/wav',
    })
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file,
      model: TRANSCRIPTION_MODEL,
      response_format: 'json',
      language,
      prompt: language === 'en'
        ? englishTranscriptionContext(options.nativeLanguage?.trim())
        : undefined,
      include: ['logprobs'],
      temperature: 0,
    }, {
      timeout: options.timeoutMs ?? 35_000,
      maxRetries: 1,
    })

    return evaluateIntelligibility(
      referenceText,
      transcription.text,
      transcription.logprobs ?? [],
      options.scope ?? 'section',
    )
  } catch (error) {
    console.error('OpenAI speech transcription failed:', error)
    throw new SpeechAnalysisServiceError()
  }
}
