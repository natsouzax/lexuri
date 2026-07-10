// Router registration — dependency-light on purpose (URL helpers only), so the
// Router never pulls in scrapers or server services just to classify a request.

import { extractVideoId, watchUrl } from './url'
import type { PlatformRegistration } from '../router/types'

export const youtubeRegistration: PlatformRegistration = {
  platform: 'youtube',
  matchUrl(input) {
    // extractVideoId also accepts a bare 11-char video ID (legacy behavior)
    const videoId = extractVideoId(input)
    if (!videoId) return null
    return { kind: 'video', id: videoId, url: watchUrl(videoId) }
  },
  intentKeywords: [
    'video', 'videos', 'youtube', 'shorts', 'canal', 'channel',
    'assistir', 'watch', 'documentario', 'documentary', 'tutorial',
    'aula', 'palestra', 'entrevista', 'interview', 'trailer', 'podcast',
  ],
}
