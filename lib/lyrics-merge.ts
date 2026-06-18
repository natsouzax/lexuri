import OpenAI from 'openai'
import { parseLrc, extractPlainFromLrc } from './lyrics'
import type { SpotifyLyricsLine } from './spotify'

export interface LyricsSourceInput {
  name: 'youtube' | 'spotify' | 'genius' | 'lrclib' | 'happi' | 'lyricsovh'
  plain_text?: string
  // YouTube segments with timing
  segments?: Array<{ text: string; start: number; duration: number }>
  // LRC format string
  lrc?: string
  // Spotify line-synced lines
  spotify_lines?: SpotifyLyricsLine[]
}

export interface MergedSegment {
  text: string
  start: number   // seconds
  duration: number
}

export interface MergeResult {
  plain_lyrics: string
  lrc_content: string | null
  segments: MergedSegment[]
  source: string
  is_synced: boolean
}

const openai = new OpenAI()

// ── ♪ detection ─────────────────────────────────────────────────────────────
// YouTube auto-captions that were verified/synced by YouTube contain ♪ markers.
// If present, the timing is already correct — skip the AI merge entirely.

function hasYoutubeSync(segments: Array<{ text: string }> | undefined): boolean {
  return !!segments?.some((s) => s.text.includes('♪'))
}

// ── LRC builder from segments ────────────────────────────────────────────────

function segmentsToLrc(segments: MergedSegment[]): string {
  return segments
    .map(({ text, start }) => {
      const m = Math.floor(start / 60).toString().padStart(2, '0')
      const s = (start % 60).toFixed(2).padStart(5, '0')
      return `[${m}:${s}]${text}`
    })
    .join('\n')
}

// ── Spotify lines → MergedSegments ───────────────────────────────────────────

function spotifyLinesToSegments(lines: SpotifyLyricsLine[]): MergedSegment[] {
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
// the most accurate plain-text lyrics. Then marries that text with the
// best timing data available (Spotify > lrclib > none).

async function aiMergeText(sources: Array<{ name: string; text: string }>): Promise<string> {
  const sourcesBlock = sources
    .map((s) => `=== ${s.name.toUpperCase()} ===\n${s.text.slice(0, 2000)}`)
    .join('\n\n')

  const completion = await openai.chat.completions.create({
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
    if (src.spotify_lines) {
      text = src.spotify_lines.filter((l) => l.words !== '♪').map((l) => l.words).join('\n')
    } else if (src.lrc) {
      text = extractPlainFromLrc(src.lrc)
    } else if (src.plain_text) {
      text = src.plain_text
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
  const spotifyInput = inputs.find((s) => s.name === 'spotify' && s.spotify_lines?.length)
  const lrclibInput = inputs.find((s) => s.name === 'lrclib' && s.lrc)

  if (spotifyInput?.spotify_lines) {
    // Spotify line-synced is highest quality for timing
    const baseSegments = spotifyLinesToSegments(spotifyInput.spotify_lines)
    const mergedLines = mergedText.split('\n').filter(Boolean)

    // Align merged text lines to Spotify timing segments by index
    const segments: MergedSegment[] = baseSegments.map((seg, i) => ({
      text: mergedLines[i] ?? seg.text,
      start: seg.start,
      duration: seg.duration,
    }))

    return {
      plain_lyrics: mergedText,
      lrc_content: segmentsToLrc(segments),
      segments,
      source: 'spotify+ai',
      is_synced: true,
    }
  }

  if (lrclibInput?.lrc) {
    // lrclib LRC as timing fallback
    const lrcLines = parseLrc(lrclibInput.lrc)
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
