const DEFAULT_MAX_BYTES = 2 * 1024 * 1024

interface PcmWavValidationOptions {
  maxBytes?: number
  minSeconds?: number
  maxSeconds?: number
  recordingName?: string
}

function ascii(view: DataView, offset: number, length: number): string {
  return Array.from(
    { length },
    (_, index) => String.fromCharCode(view.getUint8(offset + index)),
  ).join('')
}

export function validatePcmWav(
  audio: ArrayBuffer,
  options: PcmWavValidationOptions = {},
): number {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const minSeconds = options.minSeconds ?? 0.35
  const maxSeconds = options.maxSeconds ?? 30
  const recordingName = options.recordingName ?? 'recording'

  if (audio.byteLength < 44 || audio.byteLength > maxBytes) {
    throw new Error(`The ${recordingName} must be a WAV file smaller than ${Math.ceil(maxBytes / 1024 / 1024)} MB.`)
  }

  const view = new DataView(audio)
  if (ascii(view, 0, 4) !== 'RIFF' || ascii(view, 8, 4) !== 'WAVE') {
    throw new Error('Invalid WAV recording.')
  }

  let offset = 12
  let sampleRate = 0
  let channels = 0
  let bitsPerSample = 0
  let audioFormat = 0
  let dataSize = 0

  while (offset + 8 <= view.byteLength) {
    const chunkId = ascii(view, offset, 4)
    const chunkSize = view.getUint32(offset + 4, true)
    const chunkData = offset + 8
    if (chunkData + chunkSize > view.byteLength) break

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      audioFormat = view.getUint16(chunkData, true)
      channels = view.getUint16(chunkData + 2, true)
      sampleRate = view.getUint32(chunkData + 4, true)
      bitsPerSample = view.getUint16(chunkData + 14, true)
    }
    if (chunkId === 'data') dataSize = chunkSize
    offset = chunkData + chunkSize + (chunkSize % 2)
  }

  if (audioFormat !== 1 || channels !== 1 || sampleRate !== 16_000 || bitsPerSample !== 16 || dataSize === 0) {
    throw new Error('The recording must be mono PCM WAV audio at 16 kHz and 16-bit.')
  }

  const duration = dataSize / (sampleRate * channels * (bitsPerSample / 8))
  if (duration < minSeconds) throw new Error(`The ${recordingName} is too short. Speak clearly and try again.`)
  if (duration > maxSeconds) throw new Error(`The ${recordingName} must be ${maxSeconds} seconds or shorter.`)
  return duration
}

