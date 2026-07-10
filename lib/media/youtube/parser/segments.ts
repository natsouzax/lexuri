import type { TranscriptSegment } from '../types'

const ARTIFACT_RE = /^\s*(\[(Music|Applause|Laughter|Cheering|Noise|Inaudible)\]|(uh+|um+|ah+|mm+|hmm+)\.?)\s*$/i

// Sanitize raw caption segments before any merging or AI processing:
// 1. Sort by start time — multi-track fetchers (youtubei.js, Supadata) may interleave two tracks.
// 2. Strip standalone artifacts ([Music], gasps) before they can influence the merge.
// 3. Resolve overlapping segments (>0.5s overlap = two tracks at same window) by keeping
//    whichever segment has more words — more text = more informative caption.
export function sanitizeSegments(raw: TranscriptSegment[]): TranscriptSegment[] {
  if (!raw.length) return raw

  const sorted = [...raw].sort((a, b) => a.start - b.start)
  const result: TranscriptSegment[] = []

  for (const seg of sorted) {
    if (ARTIFACT_RE.test(seg.text)) continue

    const prev = result[result.length - 1]
    if (!prev) { result.push(seg); continue }

    const overlap = (prev.start + prev.duration) - seg.start

    if (overlap <= 0.5) {
      result.push(seg)
      continue
    }

    // Significant overlap: keep whichever has more words
    const prevWords = prev.text.trim().split(/\s+/).length
    const currWords = seg.text.trim().split(/\s+/).length
    if (currWords > prevWords) result[result.length - 1] = seg
  }

  return result
}

// Merge raw caption segments into display-ready subtitle blocks.
//
// Two modes, detected automatically:
//
//  WELL-FORMATTED (human captions, e.g. TED talks): >35% of segments already end
//  with sentence-ending punctuation. Trust the original structure — pass each segment
//  through as its own block. Only merge tiny stray fragments (<3 words, <80ms gap).
//
//  ASR (auto-generated, no punctuation): accumulate until a genuine sentence boundary
//  is found. Do NOT cut on short pauses — reviewAndCleanSegments + splitAtSentenceBoundaries
//  handle the real splitting after punctuation is added by GPT. Cutting mid-sentence here
//  causes GPT to add wrong punctuation at the fragment boundary.
export function mergeIntoSentences(raw: TranscriptSegment[]): TranscriptSegment[] {
  if (!raw.length) return raw

  const withSentenceEnd = raw.filter((s) => /[.!?]/.test(s.text)).length
  const wellFormatted   = withSentenceEnd / raw.length > 0.35

  const result: TranscriptSegment[] = []
  let buf: TranscriptSegment[] = []

  function flush() {
    if (!buf.length) return
    const text  = buf.map((s) => s.text.trim()).filter(Boolean).join(' ')
    const start = buf[0].start
    const last  = buf[buf.length - 1]
    result.push({
      text,
      start,
      duration: Math.max(0.1, last.start + last.duration - start),
      synthetic: buf.some((s) => s.synthetic),
    })
    buf = []
  }

  for (let i = 0; i < raw.length; i++) {
    buf.push(raw[i])

    const tail        = raw[i].text.trim()
    const next        = raw[i + 1]
    const gap         = next ? next.start - (raw[i].start + raw[i].duration) : 999
    const accumulated = buf.reduce((s, seg) => s + seg.duration, 0)
    const wordCount   = buf.reduce((n, seg) => n + (seg.text.match(/\S+/g)?.length ?? 0), 0)

    if (wellFormatted) {
      // Trust original caption breaks: flush as soon as we have a "real" segment (≥3 words).
      // Only hold tiny fragments (<3 words, <80ms gap) to merge with what follows.
      const isStrayFragment = wordCount < 3 && gap < 0.08
      const sentenceEnd     = /[.!?]$/.test(tail)
      if (!isStrayFragment || sentenceEnd || accumulated >= 6.0) flush()
    } else {
      // ASR mode: only cut on real sentence boundaries — NOT on short pauses.
      // Short pauses (≤2s) are normal within a sentence and must not trigger a cut.
      const sentenceEnd    = /[.!?]$/.test(tail)
      const naturalBreak   = wordCount >= 12 && /[,;]$/.test(tail) // clear clause end
      const genuineSilence = gap > 2.0        // 2s+ silence = definite new sentence
      const hardLimit      = accumulated >= 20.0  // emergency cap, never infinite
      if (sentenceEnd || naturalBreak || genuineSilence || hardLimit) flush()
    }
  }

  flush()
  return result
}

// After merge + punctuation repair: split any segment that still contains multiple
// sentences into one segment per sentence. Also splits [Music] / [Verse] / [Chorus]
// style markers off into their own segments (isNonSpeech filters them from display).
export function splitAtSentenceBoundaries(segs: TranscriptSegment[]): TranscriptSegment[] {
  const result: TranscriptSegment[] = []
  for (const seg of segs) {
    // Split after ./?/! followed by space+capital, OR before any [Word] marker
    const parts = seg.text
      .split(/(?<=[.!?])\s+(?=[A-Z"(\[])|(?<=\])\s+/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (parts.length <= 1) { result.push(seg); continue }

    const totalLen = parts.reduce((s, p) => s + p.length, 0)
    let cursor = seg.start
    for (const part of parts) {
      const dur = Math.max(0.4, (part.length / totalLen) * seg.duration)
      result.push({ text: part, start: cursor, duration: dur, synthetic: seg.synthetic })
      cursor += dur
    }
  }
  return result
}
