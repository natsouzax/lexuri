// Spotify module types. Type-only file — safe for client `import type`.

export interface SpotifyTrack {
  title: string
  artist: string
}

export interface SpotifyTrackSummary {
  id: string
  title: string
  artist: string
  album: string
  album_art: string | null
  preview_url: string | null
  spotify_url: string
  duration_ms: number
  popularity: number
}
