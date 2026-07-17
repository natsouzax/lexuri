import { parseTimestamp } from './time'
import type { TranscriptSegment } from '../types'

// Parse SRT/TTML caption text to plain text
function stripXmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()
}

export function parseSrt(srt: string): TranscriptSegment[] {
  const blocks = srt.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue

    const tsLine = lines.find(l => l.includes('-->'))
    if (!tsLine) continue

    const [startStr, endStr] = tsLine.split('-->')
    const start = parseTimestamp(startStr)
    const end = parseTimestamp(endStr)
    const duration = Math.max(0.1, end - start)

    const tsIdx = lines.indexOf(tsLine)
    const text = lines.slice(tsIdx + 1).map(stripXmlTags).join(' ').trim()
    if (!text) continue

    segments.push({ text, start, duration })
  }

  return segments
}
