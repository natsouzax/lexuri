// Single place where platforms are registered. To support a new platform,
// create its module (with a registration.ts) and add it here.

import { youtubeRegistration } from '../youtube/registration'
import { spotifyRegistration } from '../spotify/registration'
import type { PlatformRegistration } from './types'

// Spotify first: its track IDs are unambiguous (spotify.com/track/…), while the
// YouTube matcher also accepts bare 11-char video IDs and must run last.
export const platformRegistry: PlatformRegistration[] = [
  spotifyRegistration,
  youtubeRegistration,
]
