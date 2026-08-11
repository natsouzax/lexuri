import 'server-only'
import { getAdminClient } from '@/lib/supabase'

// Teto diário por usuário nas rotas que gastam dinheiro (OpenAI). O objetivo
// não é cobrar por uso — é impedir que uma conta sozinha (ou um script com
// login) esvazie o orçamento do teste. Os números são generosos pra uso real
// e apertados pra abuso.
export const DAILY_LIMITS = {
  /** Feedback is authenticated and deliberately low-volume. */
  feedback: 10,
  /** Toque-pra-traduzir e hover: o mais frequente de todos. */
  translate: 600,
  /** Definição completa da palavra (mais tokens que a tradução). */
  define: 300,
  /** Transcrição de treino falado: trechos curtos (≤30s) e palavras (≤8s). */
  speech: 120,
  /**
   * Performance final cantada. Balde separado do `speech` porque é a chamada
   * mais cara do app — a transcrição é cobrada por minuto de áudio, e aqui vai
   * a música inteira, não um trecho. Acontece poucas vezes por música.
   */
  performance: 15,
  /** Geração de verso/música. */
  generate: 60,
} as const

export type QuotaBucket = keyof typeof DAILY_LIMITS

export class QuotaExceededError extends Error {
  readonly bucket: QuotaBucket
  readonly limit: number

  constructor(bucket: QuotaBucket) {
    super(
      `Daily limit reached (${DAILY_LIMITS[bucket]} requests). This resets at midnight UTC — thanks for testing so thoroughly!`,
    )
    this.name = 'QuotaExceededError'
    this.bucket = bucket
    this.limit = DAILY_LIMITS[bucket]
  }
}

/**
 * Conta mais uma chamada do usuário no balde e lança `QuotaExceededError` se
 * ele já passou do teto do dia.
 *
 * Se o próprio banco falhar, deixa passar: derrubar o app inteiro porque o
 * contador quebrou seria pior que o gasto de algumas chamadas extras. O teto
 * de verdade contra catástrofe é o limite de gasto na conta da OpenAI.
 */
export async function enforceDailyQuota(userId: string, bucket: QuotaBucket): Promise<void> {
  const limit = DAILY_LIMITS[bucket]

  try {
    const { data, error } = await getAdminClient().rpc('bump_api_usage', {
      p_user_id: userId,
      p_bucket: bucket,
    })
    if (error) {
      console.error('Quota counter failed (allowing request):', error.message)
      return
    }
    if (typeof data === 'number' && data > limit) {
      throw new QuotaExceededError(bucket)
    }
  } catch (error) {
    if (error instanceof QuotaExceededError) throw error
    console.error('Quota counter threw (allowing request):', error)
  }
}
