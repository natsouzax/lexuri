import type { SongSectionType } from './types'

export const REQUIRED_TAKEAWAYS = 14

export const SONG_SECTION_LAYOUT: ReadonlyArray<{
  type: SongSectionType
  label: string
}> = [
  { type: 'verse', label: 'Verse 1' },
  { type: 'verse', label: 'Verse 2' },
  { type: 'verse', label: 'Verse 3' },
  { type: 'verse', label: 'Verse 4' },
  { type: 'chorus', label: 'Chorus' },
  { type: 'verse', label: 'Verse 5' },
  { type: 'verse', label: 'Verse 6' },
]

export interface TakeawaySource {
  id: string
  text: string
}

export interface GeneratedSongSection {
  type: SongSectionType
  label: string
  lyrics: string
}

export interface GeneratedSong {
  title: string
  sections: GeneratedSongSection[]
}

function cleanLine(value: unknown): string {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function validateGeneratedSong(value: unknown): GeneratedSong | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as { title?: unknown; sections?: unknown }
  if (!Array.isArray(candidate.sections) || candidate.sections.length !== SONG_SECTION_LAYOUT.length) {
    return null
  }

  const sections: GeneratedSongSection[] = []
  for (let index = 0; index < SONG_SECTION_LAYOUT.length; index += 1) {
    const raw = candidate.sections[index]
    if (!raw || typeof raw !== 'object') return null
    const section = raw as { lyrics?: unknown; lines?: unknown }
    const fromLines = Array.isArray(section.lines)
      ? section.lines.map(cleanLine).filter(Boolean).slice(0, 2).join('\n')
      : ''
    const lyrics = (fromLines || cleanLine(section.lyrics)).slice(0, 600)
    if (!lyrics) return null

    sections.push({
      ...SONG_SECTION_LAYOUT[index],
      lyrics,
    })
  }

  return {
    title: cleanLine(candidate.title).slice(0, 120) || 'My Lexuri Song',
    sections,
  }
}

export function buildFallbackSong(takeaways: TakeawaySource[]): GeneratedSong {
  const sections = SONG_SECTION_LAYOUT.map((layout, index) => {
    const first = cleanLine(takeaways[index * 2]?.text) || 'I keep learning every day'
    const second = cleanLine(takeaways[index * 2 + 1]?.text) || 'English helps me find my way'
    return {
      ...layout,
      lyrics: `${first}\n${second}`,
    }
  })

  return { title: 'My Learning Song', sections }
}

export function buildSongPrompt(takeaways: TakeawaySource[]): string {
  const pairs = SONG_SECTION_LAYOUT.map((section, index) => ({
    section: section.label,
    type: section.type,
    learnings: [takeaways[index * 2]?.text, takeaways[index * 2 + 1]?.text],
  }))

  return `Create an original, easy-to-sing English learning song from the student's personal learnings below.

Musical template:
- 4/4 lo-fi pop at 88 BPM.
- Exactly 7 sections in this order: Verse 1, Verse 2, Verse 3, Verse 4, Chorus, Verse 5, Verse 6.
- Every section has exactly 2 short lines.
- Aim for 6-10 spoken syllables per line and one natural phrase per line.
- Use simple A1-B1 English, natural stress, concrete language, and gentle end rhymes when possible.
- Preserve the meaning of both learnings assigned to each section. If a learning is already a useful English chunk, include it naturally.
- The Chorus must be memorable and repeatable, but still use its two assigned learnings.
- Do not copy or imitate any existing song or artist.

Assigned learnings:
${JSON.stringify(pairs, null, 2)}

Return JSON only in this exact shape:
{
  "title": "short original title",
  "sections": [
    { "label": "Verse 1", "lines": ["line one", "line two"] },
    { "label": "Verse 2", "lines": ["line one", "line two"] },
    { "label": "Verse 3", "lines": ["line one", "line two"] },
    { "label": "Verse 4", "lines": ["line one", "line two"] },
    { "label": "Chorus", "lines": ["line one", "line two"] },
    { "label": "Verse 5", "lines": ["line one", "line two"] },
    { "label": "Verse 6", "lines": ["line one", "line two"] }
  ]
}`
}

