// Router contracts. Adding a new platform (Apple Music, Deezer, SoundCloud,
// Vimeo, TikTok, Twitch, …) means creating its module with a
// PlatformRegistration and adding it to router/registry.ts — nothing else.

export type MediaPlatform = 'youtube' | 'spotify'

/** A concrete resource identified from a URL (video, track, playlist, …). */
export interface MediaResource {
  kind: string
  id: string
  url: string
}

export interface PlatformRegistration {
  platform: MediaPlatform
  /** Returns the resource when the input URL belongs to this platform. */
  matchUrl(input: string): MediaResource | null
  /** Lowercase, diacritic-free keywords used by the intent classifier. */
  intentKeywords: string[]
}

export interface MediaUrlMatch {
  platform: MediaPlatform
  resource: MediaResource
}

export interface MediaIntentMatch {
  platform: MediaPlatform
  /** Number of keyword hits — higher = more confident. */
  score: number
}

export type MediaRouteResult =
  | { type: 'url'; platform: MediaPlatform; resource: MediaResource }
  | { type: 'intent'; platform: MediaPlatform; score: number }
  | { type: 'unknown' }
