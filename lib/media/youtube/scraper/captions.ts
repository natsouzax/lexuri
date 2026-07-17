import { errorMessage } from '../errors'
import { fetchCaptionsViaSupadata } from './sources/supadata'
import { fetchCaptionsViaDataAPI } from './sources/data-api'
import { fetchCaptionsViaProxy } from './sources/proxy'
import { fetchCaptionsViaPage } from './sources/edge-page'
import { fetchCaptionsViaYoutubei } from './sources/innertube'
import { fetchCaptionsPublic } from './sources/transcript-lib'
import type { TranscriptSegment } from '../types'

interface CaptionSource {
  name: string
  enabled: () => boolean
  disabledReason: string
  fetch: (videoId: string) => Promise<TranscriptSegment[]>
}

// Ordered fallback chain. Sources that need configuration are skipped (with a
// recorded reason) when their env var is missing.
const SOURCES: CaptionSource[] = [
  {
    name: 'supadata',
    enabled: () => !!process.env.SUPADATA_API_KEY,
    disabledReason: 'SUPADATA_API_KEY not set',
    fetch: fetchCaptionsViaSupadata,
  },
  {
    name: 'data-api',
    enabled: () => !!process.env.YOUTUBE_API_KEY,
    disabledReason: 'YOUTUBE_API_KEY not set',
    fetch: fetchCaptionsViaDataAPI,
  },
  {
    name: 'proxy',
    enabled: () => !!process.env.YOUTUBE_TRANSCRIPT_PROXY_URL,
    disabledReason: 'YOUTUBE_TRANSCRIPT_PROXY_URL not set',
    fetch: fetchCaptionsViaProxy,
  },
  {
    name: 'page-fetch',
    enabled: () => true,
    disabledReason: '',
    fetch: fetchCaptionsViaPage,
  },
  {
    name: 'youtubei',
    enabled: () => true,
    disabledReason: '',
    fetch: fetchCaptionsViaYoutubei,
  },
  {
    name: 'transcript-lib',
    enabled: () => true,
    disabledReason: '',
    fetch: fetchCaptionsPublic,
  },
]

export async function fetchCaptions(videoId: string): Promise<TranscriptSegment[]> {
  const errors: string[] = []

  for (const source of SOURCES) {
    if (!source.enabled()) {
      errors.push(`${source.name}: ${source.disabledReason}`)
      continue
    }

    try {
      const segments = await source.fetch(videoId)
      if (segments.length > 0) return segments
      errors.push(`${source.name}: empty result`)
    } catch (e) {
      errors.push(`${source.name}: ${errorMessage(e)}`)
    }
  }

  throw new Error(`YouTube captions failed. ${errors.map((err, i) => `${i + 1}. ${err}`).join(' | ')}`)
}
