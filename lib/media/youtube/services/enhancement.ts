import { getOpenAIClient } from '@/lib/openai'
import type { TranscriptSegment } from '../types'

const REMOVE_MARKER = '[REMOVE]'

const SEGMENT_REVIEW_PROMPT =
  'You are a subtitle editor. Below are NUMBERED auto-generated caption lines: no punctuation, possible artifacts.\n\n' +
  'For EACH numbered line, output a line with the SAME NUMBER:\n' +
  '1. Add proper punctuation (. ! ? , ;) and capitalise the first word.\n' +
  '2. If the line contains ONLY non-speech artifacts (Music, Applause, gasps like uh/um/ah/mm/hmm, inaudible markers), ' +
  `output "N. ${REMOVE_MARKER}" instead.\n\n` +
  'CRITICAL: Output EXACTLY the same number of lines as the input, in the same order, one output line per input line. ' +
  'Never merge two lines into one, never split one line into two, never reorder, never drop a line — every input ' +
  'number must appear exactly once in the output.\n' +
  'Do NOT change, add, or remove meaningful words — only fix punctuation/capitalisation, or mark artifacts for removal.'

function parseNumberedLines(raw: string, expected: number): string[] | null {
  const map = new Map<number, string>()
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*(\d+)\.\s?(.*)$/)
    if (!m) continue
    map.set(parseInt(m[1], 10), m[2].trim())
  }
  if (map.size !== expected) return null
  const out: string[] = []
  for (let i = 1; i <= expected; i++) {
    const v = map.get(i)
    if (v === undefined) return null
    out.push(v)
  }
  return out
}

// AI cleanup pass: fixes punctuation/capitalisation and flags non-speech
// artifacts for removal. Timing is NEVER recomputed here — every output line
// keeps its ORIGINAL segment's real start/duration (from the actual caption
// track). Redistributing time by character-count proportion (the previous
// approach) is a rough approximation that drifts more the longer the batch
// runs — the exact bug behind the "growing delay" reports.
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
    const inputText = batch.map((s, idx) => `${idx + 1}. ${s.text.trim()}`).join('\n')

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 2500,
        messages: [
          { role: 'system', content: SEGMENT_REVIEW_PROMPT },
          { role: 'user', content: inputText },
        ],
      })

      const lines = parseNumberedLines(response.choices[0].message.content ?? '', batch.length)

      if (!lines) {
        // AI didn't return a clean 1:1 mapping — keep originals rather than risk timing drift.
        result.push(...batch)
        continue
      }

      for (let j = 0; j < batch.length; j++) {
        if (lines[j] === REMOVE_MARKER || !lines[j]) continue
        result.push({ ...batch[j], text: lines[j] })
      }
    } catch {
      result.push(...batch)
    }
  }

  return result
}
