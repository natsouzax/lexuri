import { describe, expect, it } from 'vitest'
import { encodePcmWav } from '@/lib/music/audio'

describe('PCM WAV encoder', () => {
  it('creates a mono 16-bit WAV header at 16 kHz', async () => {
    const samples = new Float32Array(16_000)
    const blob = encodePcmWav(samples)
    const view = new DataView(await blob.arrayBuffer())
    const ascii = (offset: number, length: number) => Array.from(
      { length },
      (_, index) => String.fromCharCode(view.getUint8(offset + index)),
    ).join('')

    expect(ascii(0, 4)).toBe('RIFF')
    expect(ascii(8, 4)).toBe('WAVE')
    expect(view.getUint16(22, true)).toBe(1)
    expect(view.getUint32(24, true)).toBe(16_000)
    expect(view.getUint16(34, true)).toBe(16)
    expect(blob.size).toBe(44 + samples.length * 2)
  })
})

