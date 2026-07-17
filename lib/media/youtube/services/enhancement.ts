import { getOpenAIClient } from '@/lib/openai'
import type { TranscriptSegment } from '../types'

const SEGMENT_REVIEW_PROMPT =
  'You are a subtitle editor. The text below is auto-generated captions: no punctuation, awkward line breaks, possible artifacts.\n\n' +
  'Do these tasks in one pass:\n' +
  '1. Add proper punctuation (. ! ? , ;) and capitalise the first word of each sentence.\n' +
  '2. Re-break lines so each ends at a natural boundary — complete sentence, clause, or comma pause. Never break mid-phrase.\n' +
  '3. Merge fragments that were split mid-phrase (e.g. "It was a car" + "accident" → "It was a car accident.").\n' +
  '4. Remove non-speech artifacts: lines that contain ONLY sounds like [Music], [Applause], gasps (uh, um, ah, mm, hmm), or inaudible markers.\n\n' +
  'Output ONLY the final lines, one per line, no numbering, no explanation.\n' +
  'Do NOT change, add, or remove meaningful words — only fix formatting and remove artifacts.'

// Single-pass AI cleanup: adds punctuation, fixes broken line boundaries, removes gasps.
// Timing is re-distributed proportionally by character length within each batch window.
export async function reviewAndCleanSegments(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
  if (!segments.length) return segments

  // Well-formatted (human captions): skip AI, only strip obvious artifacts
  const withEnd = segments.filter(s => /[.!?]$/.test(s.text.trim())).length
  if (withEnd / segments.length > 0.35) {
    return segments.filter(s => !/^\s*(\[.*?\]|(uh+|um+|ah+|mm+|hmm+)\.?)\s*$/i.test(s.text))
  }

  const BATCH = 80
  const result: TranscriptSegment[] = []

  for (let i = 0; i < segments.length; i += BATCH) {
    const batch = segments.slice(i, i + BATCH)
    const batchStart = batch[0].start
    const batchDuration = batch.reduce((s, seg) => s + seg.duration, 0)
    const inputText = batch.map(s => s.text.trim()).join('\n')

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: SEGMENT_REVIEW_PROMPT },
          { role: 'user', content: inputText },
        ],
      })

      const lines = (response.choices[0].message.content ?? '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      if (!lines.length) { result.push(...batch); continue }

      // Re-distribute timing proportionally by character length within the batch window
      const totalChars = Math.max(1, lines.reduce((s, l) => s + l.length, 0))
      let cursor = batchStart
      for (const line of lines) {
        const duration = Math.max(0.4, (line.length / totalChars) * batchDuration)
        result.push({ text: line, start: cursor, duration })
        cursor += duration
      }
    } catch {
      result.push(...batch)
    }
  }

  return result
}
