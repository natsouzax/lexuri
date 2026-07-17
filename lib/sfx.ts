'use client'

// Lightweight synthesized UI sound effects (Web Audio API) — no audio files to ship.
// Every call is triggered by a user gesture (click/tap), so autoplay policies are satisfied.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(audioCtx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType, peakGain: number) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

/** Neutral tap — step navigation, generic selection. */
export function playTap() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  tone(audioCtx, 520, audioCtx.currentTime, 0.07, 'sine', 0.07)
}

/** Slightly brighter tap — picking an option (DuoOption). */
export function playSelect() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  tone(audioCtx, 660, audioCtx.currentTime, 0.09, 'sine', 0.08)
}

/** Short ascending chime — correct answer / card saved / good rating. */
export function playSuccess() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const t = audioCtx.currentTime
  tone(audioCtx, 523.25, t, 0.12, 'sine', 0.08) // C5
  tone(audioCtx, 659.25, t + 0.09, 0.14, 'sine', 0.08) // E5
  tone(audioCtx, 783.99, t + 0.18, 0.2, 'sine', 0.09) // G5
}

/** Soft low tone — "again"/"hard" rating, gentle negative feedback. */
export function playSoft() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  tone(audioCtx, 300, audioCtx.currentTime, 0.18, 'sine', 0.05)
}

/** Four-note fanfare — level reveal, big celebratory moments. */
export function playFanfare() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const t = audioCtx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => tone(audioCtx, freq, t + i * 0.1, 0.22, 'triangle', 0.09))
}
