// Spotify Module — public API. Responsible for identifying music (tracks,
// metadata, personalized feed) and OAuth tokens. Lyrics live in the Lyrics
// module and receive tokens via dependency injection.

export { isSpotifyUrl, extractSpotifyTrackId, trackUrl } from './url'
export { getSpotifyToken, getUserAccessToken } from './services/auth'
export { resolveSpotifyTrack, searchSpotifyTrackId, fetchSpotifyTrackTitleViaOEmbed } from './services/tracks'
export { getPersonalizedTracks } from './services/feed'
export { SpotifyError, SpotifyNotConfiguredError } from './errors'
export { spotifyRegistration } from './registration'
export type { SpotifyTrack, SpotifyTrackSummary } from './types'
