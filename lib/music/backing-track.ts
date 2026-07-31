export const MUSIC_TEMPLATE = {
  bpm: 88,
  beatsPerBar: 4,
  barsPerSection: 4,
  sectionCount: 7,
  countInBeats: 4,
} as const

export const SECONDS_PER_BEAT = 60 / MUSIC_TEMPLATE.bpm
export const SECTION_SECONDS = SECONDS_PER_BEAT
  * MUSIC_TEMPLATE.beatsPerBar
  * MUSIC_TEMPLATE.barsPerSection
export const SONG_SECONDS = SECTION_SECONDS * MUSIC_TEMPLATE.sectionCount
export const COUNT_IN_SECONDS = SECONDS_PER_BEAT * MUSIC_TEMPLATE.countInBeats

interface ScheduledTrack {
  songStart: number
  endAt: number
  stop: () => void
}

interface BackingOptions {
  recordDestination?: AudioNode
  outputGain?: number
}

const CHORDS = [
  [130.81, 164.81, 196.00], // C3
  [110.00, 130.81, 164.81], // Am2
  [87.31, 130.81, 174.61],  // F2
  [98.00, 123.47, 146.83],  // G2
]

function envelope(gain: AudioParam, start: number, duration: number, peak: number) {
  gain.setValueAtTime(0.0001, start)
  gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.03)
  gain.setValueAtTime(Math.max(0.0001, peak * 0.78), Math.max(start + 0.04, start + duration - 0.08))
  gain.exponentialRampToValueAtTime(0.0001, start + duration)
}

export function scheduleBackingTrack(
  context: AudioContext,
  options: BackingOptions = {},
): ScheduledTrack {
  const nodes: AudioScheduledSourceNode[] = []
  const bus = context.createGain()
  bus.gain.value = options.outputGain ?? 0.42
  bus.connect(context.destination)
  if (options.recordDestination) bus.connect(options.recordDestination)

  const startAt = context.currentTime + 0.14
  const songStart = startAt + COUNT_IN_SECONDS
  const endAt = songStart + SONG_SECONDS

  const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.16), context.sampleRate)
  const noise = noiseBuffer.getChannelData(0)
  for (let index = 0; index < noise.length; index += 1) noise[index] = Math.random() * 2 - 1

  function click(time: number, strong = false) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = strong ? 1250 : 900
    envelope(gain.gain, time, 0.07, strong ? 0.16 : 0.1)
    oscillator.connect(gain).connect(bus)
    oscillator.start(time)
    oscillator.stop(time + 0.08)
    nodes.push(oscillator)
  }

  function kick(time: number, accent = false) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(135, time)
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.16)
    envelope(gain.gain, time, 0.2, accent ? 0.34 : 0.25)
    oscillator.connect(gain).connect(bus)
    oscillator.start(time)
    oscillator.stop(time + 0.22)
    nodes.push(oscillator)
  }

  function snare(time: number) {
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = noiseBuffer
    filter.type = 'highpass'
    filter.frequency.value = 1200
    envelope(gain.gain, time, 0.12, 0.16)
    source.connect(filter).connect(gain).connect(bus)
    source.start(time)
    source.stop(time + 0.14)
    nodes.push(source)
  }

  function hat(time: number, open = false) {
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = noiseBuffer
    filter.type = 'highpass'
    filter.frequency.value = 5200
    envelope(gain.gain, time, open ? 0.11 : 0.045, open ? 0.055 : 0.035)
    source.connect(filter).connect(gain).connect(bus)
    source.start(time)
    source.stop(time + (open ? 0.12 : 0.06))
    nodes.push(source)
  }

  function chord(time: number, frequencies: number[], chorus: boolean) {
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      oscillator.type = index === 0 ? 'triangle' : 'sine'
      oscillator.frequency.value = frequency * (chorus ? 2 : 1)
      filter.type = 'lowpass'
      filter.frequency.value = chorus ? 1800 : 1150
      envelope(gain.gain, time, SECONDS_PER_BEAT * 3.88, chorus ? 0.045 : 0.034)
      oscillator.connect(filter).connect(gain).connect(bus)
      oscillator.start(time)
      oscillator.stop(time + SECONDS_PER_BEAT * 3.9)
      nodes.push(oscillator)
    })
  }

  function bass(time: number, frequency: number, chorus: boolean) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency / 2
    envelope(gain.gain, time, SECONDS_PER_BEAT * 0.82, chorus ? 0.14 : 0.1)
    oscillator.connect(gain).connect(bus)
    oscillator.start(time)
    oscillator.stop(time + SECONDS_PER_BEAT * 0.85)
    nodes.push(oscillator)
  }

  function guideNote(time: number, frequency: number, chorus: boolean) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    envelope(gain.gain, time, SECONDS_PER_BEAT * 0.55, chorus ? 0.035 : 0.025)
    oscillator.connect(gain).connect(bus)
    oscillator.start(time)
    oscillator.stop(time + SECONDS_PER_BEAT * 0.58)
    nodes.push(oscillator)
  }

  for (let beat = 0; beat < MUSIC_TEMPLATE.countInBeats; beat += 1) {
    click(startAt + beat * SECONDS_PER_BEAT, beat === 0)
  }

  const totalBars = MUSIC_TEMPLATE.sectionCount * MUSIC_TEMPLATE.barsPerSection
  for (let bar = 0; bar < totalBars; bar += 1) {
    const sectionIndex = Math.floor(bar / MUSIC_TEMPLATE.barsPerSection)
    const chorus = sectionIndex === 4
    const chordIndex = bar % CHORDS.length
    const barStart = songStart + bar * MUSIC_TEMPLATE.beatsPerBar * SECONDS_PER_BEAT
    chord(barStart, CHORDS[chordIndex], chorus)

    for (let beat = 0; beat < MUSIC_TEMPLATE.beatsPerBar; beat += 1) {
      const beatAt = barStart + beat * SECONDS_PER_BEAT
      kick(beatAt, beat === 0 || chorus)
      if (beat === 1 || beat === 3) snare(beatAt)
      bass(beatAt, CHORDS[chordIndex][0], chorus)
      guideNote(beatAt, CHORDS[chordIndex][(beat + 1) % 3] * 2, chorus)
      hat(beatAt, beat === 3)
      hat(beatAt + SECONDS_PER_BEAT / 2)
    }
  }

  return {
    songStart,
    endAt,
    stop() {
      for (const node of nodes) {
        try { node.stop() } catch { /* already stopped */ }
      }
      try { bus.disconnect() } catch { /* already disconnected */ }
    },
  }
}

export function sectionIndexAt(elapsedSeconds: number): number {
  return Math.max(0, Math.min(
    MUSIC_TEMPLATE.sectionCount - 1,
    Math.floor(elapsedSeconds / SECTION_SECONDS),
  ))
}

