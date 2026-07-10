export type LyricsQuality = 'perfect' | 'good' | 'unverified'

export interface QualityResult {
  quality: LyricsQuality
  reason: string
}

// Determines whether a lyrics text meets the bar for use in the app.
//
//   perfect   → has LRC timestamps — synced, line-by-line display works perfectly
//   good      → plain text but well-formed (enough lines, no obvious artifacts)
//   unverified → too short, too many duplicates, garbled, or OCR-style all-caps
//
// Only 'perfect' and 'good' are shown to the user without a warning card.
export function assessLyricsQuality(plain: string, lrc?: string | null): QualityResult {
  // Synced LRC is always perfect — timestamps guarantee structure
  if (lrc && /\[\d{1,2}:\d{2}[.:]\d+\]/.test(lrc)) {
    return { quality: 'perfect', reason: 'synced LRC with timestamps' }
  }

  const lines = plain.split('\n').map(l => l.trim()).filter(Boolean)

  if (lines.length < 8) {
    return { quality: 'unverified', reason: `too few lines (${lines.length})` }
  }

  // Detect copy-paste duplication (e.g. repeated chorus blocks filling short pages)
  const unique = new Set(lines).size
  if ((lines.length - unique) / lines.length > 0.25) {
    return { quality: 'unverified', reason: 'excessive duplicate lines' }
  }

  // Lines that are too short are word fragments; too long are poorly formatted OCR
  const avgLen = lines.reduce((s, l) => s + l.length, 0) / lines.length
  if (avgLen < 6) {
    return { quality: 'unverified', reason: 'lines too short (fragments)' }
  }
  if (avgLen > 180) {
    return { quality: 'unverified', reason: 'lines too long (formatting issue)' }
  }

  // ALL-CAPS text is usually an OCR artifact or a poorly-formatted source
  const capsLines = lines.filter(l => l.length > 4 && l === l.toUpperCase() && /[A-Z]/.test(l))
  if (capsLines.length / lines.length > 0.4) {
    return { quality: 'unverified', reason: 'excessive ALL-CAPS lines' }
  }

  if (lines.length >= 12) {
    return { quality: 'good', reason: `${lines.length} well-formed lines` }
  }

  return { quality: 'unverified', reason: 'insufficient content' }
}
