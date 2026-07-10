// Media Router — the single entry point that decides which platform module
// handles a request. Priority: URL detection first (a URL already identifies
// the platform), intent classification as fallback for free text.

import { detectMediaUrl } from './url-detector'
import { classifyMediaIntent } from './intent-classifier'
import type { MediaRouteResult } from './types'

export { detectMediaUrl } from './url-detector'
export { classifyMediaIntent } from './intent-classifier'
export { platformRegistry } from './registry'
export type {
  MediaPlatform,
  MediaResource,
  MediaUrlMatch,
  MediaIntentMatch,
  MediaRouteResult,
  PlatformRegistration,
} from './types'

export function routeMediaRequest(input: string): MediaRouteResult {
  const urlMatch = detectMediaUrl(input)
  if (urlMatch) return { type: 'url', platform: urlMatch.platform, resource: urlMatch.resource }

  const intent = classifyMediaIntent(input)
  if (intent) return { type: 'intent', platform: intent.platform, score: intent.score }

  return { type: 'unknown' }
}
