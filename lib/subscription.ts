// Protótipo de validação: sem venda, sem gating de plano. Todo mundo tem
// acesso liberado — mantém a mesma assinatura das funções originais pra não
// precisar tocar nas rotas que já as chamam (feed, youtube, chunks, etc.).

export interface PremiumStatus {
  isPremium: boolean
  planKey: 'free' | 'pro' | 'lifetime'
  source: 'stripe' | 'coupon' | 'lifetime' | 'none'
  expiresAt: Date | null
}

export const FREE_LIMITS = {
  weeklyYoutubeImports: Infinity,
  weeklyMusicImports: Infinity,
  weeklyChunkAnalyses: Infinity,
  feedItems: Infinity,
} as const

export async function getUserPremiumStatus(_userId: string): Promise<PremiumStatus> {
  return { isPremium: true, planKey: 'lifetime', source: 'lifetime', expiresAt: null }
}

export async function getWeeklyUsage(_userId: string) {
  return { ytImports: 0, musicImports: 0, chunkAnalyses: 0, feedItems: 0 }
}

export async function incrementWeeklyUsage(
  _userId: string,
  _field: 'yt_imports' | 'music_imports' | 'chunk_analyses' | 'feed_opens',
): Promise<void> {
  // no-op — validação não rastreia quota
}
