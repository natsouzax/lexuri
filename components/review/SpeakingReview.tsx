'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  recordedBlobToPcmWav,
  supportedRecordingMimeType,
} from '@/lib/music/audio'
import { getNativeLangName } from '@/lib/i18n'
import type {
  SpeakingReviewAssessment,
  SpeakingReviewData,
  SpeakingReviewItem,
} from '@/lib/music/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options)
  const data = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data as T
}

export default function SpeakingReview() {
  const [data, setData] = useState<SpeakingReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [result, setResult] = useState<SpeakingReviewAssessment | null>(null)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const current: SpeakingReviewItem | null = data?.items[0] ?? null

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await apiFetch<SpeakingReviewData>('/api/speaking-review'))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const clearCapture = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    timerRef.current = null
    autoStopRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
    setRecording(false)
    setRecordingSeconds(0)
  }, [])

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null
      recorder.onstop = null
      recorder.stop()
    }
    clearCapture()
    clearPreview()
  }, [clearCapture, clearPreview])

  function hearWord(slow = false) {
    if (!current) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(current.word)
    utterance.lang = 'en-US'
    utterance.rate = slow ? 0.45 : 0.85
    window.speechSynthesis.speak(utterance)
  }

  async function assessRecording(item: SpeakingReviewItem, blob: Blob) {
    setAnalysing(true)
    setError('')
    try {
      const wav = await recordedBlobToPcmWav(blob)
      const form = new FormData()
      form.append('audio', wav, 'speaking-review.wav')
      form.append('nativeLanguage', getNativeLangName())
      setResult(await apiFetch<SpeakingReviewAssessment>(
        `/api/speaking-review/${item.id}/assess`,
        { method: 'POST', body: form },
      ))
    } catch (assessmentError) {
      setError(assessmentError instanceof Error ? assessmentError.message : String(assessmentError))
    } finally {
      setAnalysing(false)
    }
  }

  async function startRecording() {
    if (!current || result?.understood) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Use a current version of Chrome, Edge, Firefox, or Safari.')
      return
    }

    setError('')
    setResult(null)
    clearPreview()
    window.speechSynthesis.cancel()
    try {
      const item = current
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      const mimeType = supportedRecordingMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.onerror = () => {
        setError('The browser interrupted the recording. Try again.')
        clearCapture()
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
        clearCapture()
        if (blob.size === 0) {
          setError('The recording was empty. Keep the microphone active and try again.')
          return
        }
        const url = URL.createObjectURL(blob)
        previewUrlRef.current = url
        setPreviewUrl(url)
        void assessRecording(item, blob)
      }

      streamRef.current = stream
      recorderRef.current = recorder
      setRecording(true)
      const startedAt = Date.now()
      timerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 250)
      autoStopRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 7_000)
      recorder.start(200)
    } catch (recordError) {
      clearCapture()
      setError(recordError instanceof Error ? recordError.message : 'Microphone permission was denied.')
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  async function nextWord() {
    setResult(null)
    clearPreview()
    await load()
  }

  async function skipForLater() {
    if (!current || recording || analysing) return
    setSkipping(true)
    setError('')
    try {
      await apiFetch(`/api/speaking-review/${current.id}/skip`, { method: 'POST' })
      setResult(null)
      clearPreview()
      await load()
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : String(skipError))
    } finally {
      setSkipping(false)
    }
  }

  if (loading && !data) {
    return <div className="speaking-review-loading"><span className="spinner" /> Preparing your speaking practice…</div>
  }

  if (!current) {
    return (
      <>
        <StatsRow data={data} />
        <div className="speaking-review-empty">
          <div className="speaking-review-empty-icon" aria-hidden="true">✓</div>
          <h2>{data?.stats.total ? 'You are caught up.' : 'No speaking words yet.'}</h2>
          <p>
            {data?.stats.total
              ? 'The words you pronounced clearly are scheduled for a future session.'
              : 'Finish a personal-song performance, then save the words under “Practice next”.'}
          </p>
          <Link href="/my-song" className="btn-primary">
            {data?.stats.total ? 'Back to my song' : 'Open Music Studio'}
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <StatsRow data={data} />
      <section className="speaking-review-session">
        {error && <div className="alert-error">{error}</div>}
        {!data?.speechAnalysisConfigured && (
          <div className="alert-warn">Voice analysis is not configured yet.</div>
        )}

        <div className="speaking-review-progress">
          <span>{data?.items.length ?? 0} due today</span>
          <div><i style={{ width: `${100 / Math.max(1, data?.items.length ?? 1)}%` }} /></div>
        </div>

        <article className="speaking-review-card">
        <span className="mini-label">Say this word</span>
        <h2>{current.word}</h2>
        <p>Listen once if you need it, then say the word clearly. The AI must understand it before you move on.</p>

        <div className="speaking-review-actions">
          <button type="button" className="btn-secondary" onClick={() => hearWord()} disabled={recording || analysing}>
            <SpeakerIcon /> Hear word
          </button>
          <button type="button" className="btn-secondary" onClick={() => hearWord(true)} disabled={recording || analysing}>
            <SlowSpeakerIcon /> Hear slowly
          </button>
          {!recording ? (
            <button
              type="button"
              className="btn-primary speaking-review-record"
              onClick={startRecording}
              disabled={analysing || result?.understood || !data?.speechAnalysisConfigured}
            >
              {analysing ? <><span className="spinner" /> AI is listening…</> : <><MicIcon /> Say the word</>}
            </button>
          ) : (
            <button type="button" className="music-record-stop" onClick={stopRecording}>
              <span /> Stop · {recordingSeconds}s
            </button>
          )}
        </div>

        {previewUrl && !recording && (
          <div className="speaking-review-playback">
            <span>Your recording</span>
            <audio controls preload="metadata" src={previewUrl} />
          </div>
        )}

        {result && (
          <div className={`speaking-review-result ${result.understood ? 'understood' : 'retry'}`} aria-live="polite">
            <div className="speaking-review-result-icon" aria-hidden="true">{result.understood ? '✓' : '↻'}</div>
            <div>
              <strong>{result.understood ? 'Understood!' : 'Not clear yet'}</strong>
              <span>AI heard: {result.recognizedText ? `“${result.recognizedText}”` : 'no clear speech'}</span>
              <p>{result.feedback}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="speaking-review-next">
            {result.understood ? (
              <button type="button" className="btn-primary" onClick={nextWord}>Next word →</button>
            ) : (
              <button type="button" className="btn-primary" onClick={startRecording}>Try again</button>
            )}
          </div>
        )}

        <footer className="speaking-review-card-footer">
          <span className="speaking-review-privacy">
            <ShieldIcon />
            Audio is processed temporarily and is not saved by Lexuri.
          </span>
          {!result?.understood && (
            <button
              type="button"
              className="speaking-review-skip"
              onClick={skipForLater}
              disabled={recording || analysing || skipping}
              title="Keep this word in your study queue and bring it back in 4 hours"
            >
              <ClockIcon />
              <span>
                <strong>{skipping ? 'Skipping…' : 'Skip for now'}</strong>
                <small>Back in 4h</small>
              </span>
            </button>
          )}
        </footer>
        </article>
      </section>
    </>
  )
}

function StatsRow({ data }: { data: SpeakingReviewData | null }) {
  return (
    <div className="stat-pill-row speaking-review-stats">
      <div className="stat-pill">
        <span className="stat-pill-icon clay" aria-hidden="true">●</span>
        <span className="stat-pill-text"><span className="stat-pill-value">{data?.stats.due ?? 0} Due</span><span className="stat-pill-label">Ready to speak</span></span>
      </div>
      <div className="stat-pill">
        <span className="stat-pill-icon butter" aria-hidden="true">↗</span>
        <span className="stat-pill-text"><span className="stat-pill-value">{data?.stats.learning ?? 0} Learning</span><span className="stat-pill-label">Building clarity</span></span>
      </div>
      <div className="stat-pill">
        <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }} aria-hidden="true">✓</span>
        <span className="stat-pill-text"><span className="stat-pill-value">{data?.stats.mastered ?? 0} Strong</span><span className="stat-pill-label">3+ clear reviews</span></span>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  )
}

function SlowSpeakerIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
      <path d="M18 7v10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
