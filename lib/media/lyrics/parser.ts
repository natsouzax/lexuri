// Client-safe LRC utilities — zero dependencies, no server-only imports.
// Client components must import from this file directly ('@/lib/media/lyrics/parser'),
// never from the module index (which pulls in server-side providers).

export interface LrcLine {
  time: number
  text: string
}

export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []
  for (const raw of lrc.split('\n')) {
    const match = raw.match(/^\[(\d{1,2}):(\d{2}\.\d+)\](.*)$/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseFloat(match[2])
      lines.push({ time: minutes * 60 + seconds, text: match[3].trim() })
    }
  }
  return lines
}

export function extractPlainFromLrc(lrc: string): string {
  const lines: string[] = []
  for (const raw of lrc.split('\n')) {
    const line = raw.trim()
    // Skip LRC metadata tags: [ti:...], [ar:...], [al:...], [by:...], [offset:...]
    if (/^\[[a-zA-Z]/.test(line)) continue
    // Timestamp lines — strip the [mm:ss.xx] prefix, keep empty strings as stanza breaks
    if (/^\[\d{1,2}:\d{2}[.:]\d+\]/.test(line)) {
      lines.push(line.replace(/^\[\d{1,2}:\d{2}[.:]\d+\]\s*/, ''))
    }
    // Lines with no timestamp (bare blank lines in some LRC files) — skip
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function buildLrc(lines: LrcLine[]): string {
  return lines
    .map(({ time, text }) => {
      const m = Math.floor(time / 60).toString().padStart(2, '0')
      const s = (time % 60).toFixed(2).padStart(5, '0')
      return `[${m}:${s}]${text}`
    })
    .join('\n')
}

// Given a live playback position, finds the last line whose timestamp has
// passed — the same linear scan used to drive "active line" highlighting
// against any real-time position source (YouTube, Spotify, etc.).
export function findActiveLineIndex(lines: LrcLine[], currentTime: number): number | null {
  let found: number | null = null
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) found = i
    else break
  }
  return found
}

// Approximate per-line timestamps for lyrics with no real sync data (most
// scraped/plain-text sources have none), so a player still tracks roughly
// the right line as it plays instead of showing a static list. Weighted by
// character length — the same heuristic already used elsewhere in this
// codebase to distribute timing across AI-repaired transcript segments.
export function estimateLineTimings(lines: string[], durationSec: number): LrcLine[] {
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean)
  if (!nonEmpty.length || durationSec <= 0) return []
  const totalChars = nonEmpty.reduce((s, l) => s + l.length, 0) || 1
  let cursor = 0
  return nonEmpty.map((text) => {
    const time = cursor
    cursor += (text.length / totalChars) * durationSec
    return { time, text }
  })
}
