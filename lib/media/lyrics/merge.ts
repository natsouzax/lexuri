// Multi-source lyrics merge: combines imperfect text versions with AI, then
// marries the result with the best available timing data (line-synced timed
// lines > lrclib LRC > none). Platform-neutral — timed lines arrive as the
// internal TimedLine model regardless of which platform produced them.

import { getOpenAIClient } from '@/lib/openai'
import { buildLrc, parseLrc, extractPlainFromLrc } from './parser'
import type { TimedLine } from './types'

export interface LyricsSourceInput {
  name: 'youtube' | 'spotify' | 'genius' | 'lrclib' | 'lyricsovh'
  plainText?: string
  // Caption segments with timing (e.g. YouTube)
  segments?: Array<{ text: string; start: number; duration: number }>
  // LRC format string
  lrc?: string
  // Line-synced lyrics (e.g. Spotify Musixmatch)
  timedLines?: TimedLine[]
}

export interface MergedSegment {
  text: string
  start: number // seconds
  duration: number
}

export interface MergeResult {
  plain_lyrics: string
  lrc_content: string | null
  segments: MergedSegment[]
  source: string
  is_synced: boolean
}

// ── ♪ detection ─────────────────────────────────────────────────────────────
// YouTube auto-captions that were verified/synced by YouTube contain ♪ markers.
// If present, the timing is already correct — skip the AI merge entirely.

function hasYoutubeSync(segments: Array<{ text: string }> | undefined): boolean {
  return !!segments?.some((s) => s.text.includes('♪'))
}

function segmentsToLrc(segments: MergedSegment[]): string {
  return buildLrc(segments.map(({ text, start }) => ({ time: start, text })))
}

function timedLinesToSegments(lines: TimedLine[]): MergedSegment[] {
  return lines
    .filter((l) => l.words.trim() && l.words !== '♪')
    .map((l, i) => {
      const next = lines[i + 1]
      const start = l.startTimeMs / 1000
      const end = next ? next.startTimeMs / 1000 : (l.endTimeMs > 0 ? l.endTimeMs / 1000 : start + 3)
      return { text: l.words, start, duration: Math.max(0.5, end - start) }
    })
}

// ── AI merge ─────────────────────────────────────────────────────────────────
// Sends all available text sources to GPT-4o-mini and asks it to produce
// the most accurate plain-text lyrics.

async function aiMergeText(sources: Array<{ name: string; text: string }>): Promise<string> {
  const sourcesBlock = sources
    .map((s) => `=== ${s.name.toUpperCase()} ===\n${s.text.slice(0, 2000)}`)
    .join('\n\n')

  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 2000,
    messages: [
      {
        role: 'system',
        content:
          'You are a lyrics accuracy expert. Given multiple imperfect versions of the same song lyrics, produce the single most accurate and complete version. Preserve line breaks and section markers like [Verse 1], [Chorus]. Output ONLY the final lyrics text — no preamble, no explanation.',
      },
      {
        role: 'user',
        content: `Multiple sources for the same song:\n\n${sourcesBlock}\n\nOutput the most accurate lyrics:`,
      },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() ?? sources[0]?.text ?? ''
}

// ── Public function ───────────────────────────────────────────────────────────

export async function mergeLyricsSources(inputs: LyricsSourceInput[]): Promise<MergeResult> {
  // ─ Fast path: YouTube ♪ → already verified synced, return immediately ─
  const ytSource = inputs.find((s) => s.name === 'youtube')
  if (ytSource?.segments && hasYoutubeSync(ytSource.segments)) {
    const plain = ytSource.segments.map((s) => s.text).join('\n')
    return {
      plain_lyrics: plain,
      lrc_content: segmentsToLrc(ytSource.segments),
      segments: ytSource.segments,
      source: 'youtube_synced',
      is_synced: true,
    }
  }

  // ─ Collect text versions (for AI accuracy merge) ─
  const textSources: Array<{ name: string; text: string }> = []

  for (const src of inputs) {
    let text = ''
    if (src.timedLines) {
      text = src.timedLines.filter((l) => l.words !== '♪').map((l) => l.words).join('\n')
    } else if (src.lrc) {
      text = extractPlainFromLrc(src.lrc)
    } else if (src.plainText) {
      text = src.plainText
    } else if (src.segments) {
      text = src.segments.map((s) => s.text).join('\n')
    }
    if (text.trim()) textSources.push({ name: src.name, text })
  }

  if (!textSources.length) {
    return { plain_lyrics: '', lrc_content: null, segments: [], source: 'none', is_synced: false }
  }

  // ─ Merge text with AI if we have more than one source, otherwise use as-is ─
  const mergedText =
    textSources.length > 1
      ? await aiMergeText(textSources)
      : textSources[0].text

  // ─ Collect timing (best source wins) ─
  const timedInput = inputs.find((s) => s.timedLines?.length)
  const lrcInput = inputs.find((s) => s.name === 'lrclib' && s.lrc)

  if (timedInput?.timedLines) {
    // Line-synced source (Spotify) is highest quality for timing
    const baseSegments = timedLinesToSegments(timedInput.timedLines)
    const mergedLines = mergedText.split('\n').filter(Boolean)

    // Align merged text lines to the timed segments by index
    const segments: MergedSegment[] = baseSegments.map((seg, i) => ({
      text: mergedLines[i] ?? seg.text,
      start: seg.start,
      duration: seg.duration,
    }))

    return {
      plain_lyrics: mergedText,
      lrc_content: segmentsToLrc(segments),
      segments,
      source: `${timedInput.name}+ai`,
      is_synced: true,
    }
  }

  if (lrcInput?.lrc) {
    // lrclib LRC as timing fallback
    const lrcLines = parseLrc(lrcInput.lrc)
    const mergedLines = mergedText.split('\n').filter(Boolean)

    const segments: MergedSegment[] = lrcLines.map((l, i) => {
      const next = lrcLines[i + 1]
      return {
        text: mergedLines[i] ?? l.text,
        start: l.time,
        duration: next ? next.time - l.time : 3,
      }
    })

    return {
      plain_lyrics: mergedText,
      lrc_content: segmentsToLrc(segments),
      segments,
      source: 'lrclib+ai',
      is_synced: true,
    }
  }

  // No timing source — return plain only
  return {
    plain_lyrics: mergedText,
    lrc_content: null,
    segments: [],
    source: textSources.map((s) => s.name).join('+'),
    is_synced: false,
  }
}
