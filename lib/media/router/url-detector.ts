import { platformRegistry } from './registry'
import type { MediaUrlMatch } from './types'

// URL detection is the first routing step: when the input carries a URL the
// platform is unambiguous — no intent classification needed.
export function detectMediaUrl(input: string): MediaUrlMatch | null {
  const value = input.trim()
  if (!value) return null

  for (const registration of platformRegistry) {
    const resource = registration.matchUrl(value)
    if (resource) return { platform: registration.platform, resource }
  }

  return null
}
