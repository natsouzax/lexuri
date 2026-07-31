import { describe, expect, it } from 'vitest'
import {
  REQUIRED_TAKEAWAYS,
  SONG_SECTION_LAYOUT,
  buildFallbackSong,
  validateGeneratedSong,
} from '@/lib/music/song'

const takeaways = Array.from({ length: REQUIRED_TAKEAWAYS }, (_, index) => ({
  id: `takeaway-${index + 1}`,
  text: `learning ${index + 1}`,
}))

describe('personal song structure', () => {
  it('maps fourteen takeaways to six verses and one chorus', () => {
    const song = buildFallbackSong(takeaways)
    expect(song.sections).toHaveLength(7)
    expect(song.sections.map((section) => section.type)).toEqual(
      SONG_SECTION_LAYOUT.map((section) => section.type),
    )
    expect(song.sections[4].type).toBe('chorus')
    expect(song.sections[4].lyrics).toContain('learning 9')
    expect(song.sections[4].lyrics).toContain('learning 10')
  })

  it('normalizes a valid structured model response', () => {
    const song = validateGeneratedSong({
      title: '  Keep Going  ',
      sections: SONG_SECTION_LAYOUT.map((section, index) => ({
        label: section.label,
        lines: [`Line ${index * 2 + 1}`, `Line ${index * 2 + 2}`],
      })),
    })
    expect(song?.title).toBe('Keep Going')
    expect(song?.sections[4]).toEqual({
      type: 'chorus',
      label: 'Chorus',
      lyrics: 'Line 9\nLine 10',
    })
  })

  it('rejects a response with the wrong number of sections', () => {
    expect(validateGeneratedSong({ title: 'Nope', sections: [] })).toBeNull()
  })
})

