import { platformRegistry } from './registry'
import type { MediaIntentMatch } from './types'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Keyword-scored intent classification, used only when no URL is present.
// Each platform contributes its own keywords via its registration, so adding
// a platform never touches this logic.
export function classifyMediaIntent(text: string): MediaIntentMatch | null {
  const words = new Set(normalize(text).split(/[^a-z0-9]+/).filter(Boolean))
  if (!words.size) return null

  let best: MediaIntentMatch | null = null

  for (const registration of platformRegistry) {
    const score = registration.intentKeywords.reduce(
      (n, keyword) => n + (words.has(keyword) ? 1 : 0),
      0,
    )
    if (score > 0 && (!best || score > best.score)) {
      best = { platform: registration.platform, score }
    }
  }

  return best
}
