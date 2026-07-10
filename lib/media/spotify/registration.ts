// Router registration — dependency-light on purpose (URL helpers only).

import { extractSpotifyTrackId, isSpotifyUrl, trackUrl } from './url'
import type { PlatformRegistration } from '../router/types'

export const spotifyRegistration: PlatformRegistration = {
  platform: 'spotify',
  matchUrl(input) {
    if (!isSpotifyUrl(input)) return null
    const trackId = extractSpotifyTrackId(input)
    if (!trackId) return null
    return { kind: 'track', id: trackId, url: trackUrl(trackId) }
  },
  intentKeywords: [
    'musica', 'music', 'song', 'cancao', 'toque', 'tocar', 'play',
    'ouvir', 'listen', 'artista', 'artist', 'album', 'playlist',
    'banda', 'band', 'cantor', 'cantora', 'singer', 'spotify',
    'faixa', 'track', 'letra', 'letras', 'lyrics', 'refrao', 'chorus',
  ],
}
