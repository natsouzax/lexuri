// Media layer composition root.
//
// This is the ONLY file that wires platform modules together. The modules
// themselves (router, youtube, spotify, lyrics) never import each other —
// they communicate through interfaces, and this file supplies the concrete
// implementations (Spotify tokens for the Spotify lyrics provider, YouTube
// music captions as a lyrics source, provider order, cache).

import { LyricsService } from './lyrics/service'
import { InMemoryLyricsCache } from './lyrics/cache'
import { lrcLibProvider, lrcLibSearchProvider } from './lyrics/providers/lrclib'
import { geniusProvider } from './lyrics/providers/genius'
import { letrasProvider } from './lyrics/providers/letras'
import { cifraClubProvider } from './lyrics/providers/cifraclub'
import { createSpotifyLyricsProvider } from './lyrics/providers/spotify-lyrics'
import { getUserAccessToken } from './spotify/services/auth'
import { getMusicCaptions } from './youtube/services/music-captions'
import type { LyricsProvider } from './lyrics/providers/types'

export { routeMediaRequest, detectMediaUrl, classifyMediaIntent } from './router'

// Adapter: strict YouTube music captions (human-verified or ♪-marked only)
// exposed to the Lyrics module through the LyricsProvider interface.
const youtubeCaptionsProvider: LyricsProvider = {
  name: 'youtube_strict',
  async fetch({ artist, title, youtubeVideoId }) {
    if (!youtubeVideoId) return null
    const segments = await getMusicCaptions(youtubeVideoId)
    if (!segments?.length) return null
    return {
      title,
      artist,
      plainLyrics: segments.map((s) => s.text).join('\n'),
      syncedLrc: null,
      lines: [],
      source: 'youtube_strict',
      verified: false,
    }
  },
}

// Music lyrics pipeline, ordered by quality:
// synced free sources → strict YouTube captions → Spotify line-synced → scrapers.
let musicLyricsService: LyricsService | null = null

export function getMusicLyricsService(): LyricsService {
  musicLyricsService ??= new LyricsService(
    [
      lrcLibProvider,
      lrcLibSearchProvider,
      youtubeCaptionsProvider,
      createSpotifyLyricsProvider({ getUserToken: getUserAccessToken }),
      letrasProvider,
      geniusProvider,
      cifraClubProvider,
    ],
    new InMemoryLyricsCache(),
  )
  return musicLyricsService
}
