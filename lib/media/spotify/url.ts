// Spotify URL handling — pure functions, no server dependencies.

export function isSpotifyUrl(input: string): boolean {
  return /(?:^|\.|\/\/)(?:open\.)?spotify\.com\//i.test(input.trim())
}

export function extractSpotifyTrackId(url: string): string | null {
  // Spotify share links may carry a locale segment before the resource type,
  // e.g. open.spotify.com/intl-pt/track/<id> — allow any path segment there.
  const match = url.match(/spotify\.com\/(?:[a-z-]+\/)?track\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

export function trackUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`
}
