// Free-text song discovery — separate from lyrics resolution. lrclib.net's
// own search endpoint is small, unranked and occasionally flaky/rate-limited,
// so title/artist search goes through Apple's public iTunes Search API
// instead (reliable, no key, well-ranked). Once the user picks a candidate,
// the actual lyrics/sync/audio-source resolution still goes through the
// multi-provider Lyrics module — this file only answers "what song is this?".

export interface TrackCandidate {
  title: string
  artist: string
  album: string
  artworkUrl: string | null
  durationMs: number
}

interface ITunesResult {
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl100?: string
  trackTimeMillis?: number
}

export async function searchTrackCandidates(query: string): Promise<TrackCandidate[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { results?: ITunesResult[] }
    return (data.results ?? [])
      .filter((r): r is ITunesResult & { trackName: string; artistName: string } => !!r.trackName && !!r.artistName)
      .map((r) => ({
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName ?? '',
        artworkUrl: r.artworkUrl100 ?? null,
        durationMs: r.trackTimeMillis ?? 0,
      }))
  } catch {
    return []
  }
}
