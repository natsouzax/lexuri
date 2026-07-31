'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  recordedBlobToPcmWav,
  supportedRecordingMimeType,
  extensionForMime,
} from '@/lib/music/audio'
import {
  COUNT_IN_SECONDS,
  SECTION_SECONDS,
  SONG_SECONDS,
  scheduleBackingTrack,
  sectionIndexAt,
} from '@/lib/music/backing-track'
import type {
  MusicStudioData,
  PersonalSongSection,
  PronunciationAttempt,
  PronunciationResult,
} from '@/lib/music/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options)
  const data = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data as T
}

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'var(--muted)'
  if (score >= 85) return 'var(--moss)'
  if (score >= 70) return '#9a7412'
  return '#b84335'
}

function latestAttemptsBySection(attempts: PronunciationAttempt[]) {
  const latest = new Map<string, PronunciationAttempt>()
  for (const attempt of attempts) {
    if (!latest.has(attempt.section_id)) latest.set(attempt.section_id, attempt)
  }
  return latest
}

interface LiveResult extends PronunciationResult {
  attemptId: string
  createdAt: string
}

type PerformanceMode = 'idle' | 'rehearsal' | 'count-in' | 'recording'

export default function MusicStudio() {
  const [data, setData] = useState<MusicStudioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const [recordingSectionId, setRecordingSectionId] = useState<string | null>(null)
  const [analysingSectionId, setAnalysingSectionId] = useState<string | null>(null)
  const [liveResults, setLiveResults] = useState<Record<string, LiveResult>>({})
  const [practiceSeconds, setPracticeSeconds] = useState(0)
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('idle')
  const [performanceSection, setPerformanceSection] = useState(0)
  const [performanceElapsed, setPerformanceElapsed] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [consent, setConsent] = useState(false)

  const practiceRecorderRef = useRef<MediaRecorder | null>(null)
  const practiceStreamRef = useRef<MediaStream | null>(null)
  const practiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const practiceAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const performanceStreamRef = useRef<MediaStream | null>(null)
  const performanceRecorderRef = useRef<MediaRecorder | null>(null)
  const performanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const performanceStartRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const performanceStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduledTrackRef = useRef<ReturnType<typeof scheduleBackingTrack> | null>(null)
  const discardPerformanceRef = useRef(false)

  const load = useCallback(async () => {
    try {
      setError('')
      setData(await apiFetch<MusicStudioData>('/api/user-songs'))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cleanupPractice = useCallback(() => {
    if (practiceTimerRef.current) clearInterval(practiceTimerRef.current)
    if (practiceAutoStopRef.current) clearTimeout(practiceAutoStopRef.current)
    practiceTimerRef.current = null
    practiceAutoStopRef.current = null
    practiceStreamRef.current?.getTracks().forEach((track) => track.stop())
    practiceStreamRef.current = null
    practiceRecorderRef.current = null
    setRecordingSectionId(null)
    setPracticeSeconds(0)
  }, [])

  const cleanupPerformance = useCallback(async () => {
    if (performanceTimerRef.current) clearInterval(performanceTimerRef.current)
    if (performanceStartRef.current) clearTimeout(performanceStartRef.current)
    if (performanceStopRef.current) clearTimeout(performanceStopRef.current)
    performanceTimerRef.current = null
    performanceStartRef.current = null
    performanceStopRef.current = null
    scheduledTrackRef.current?.stop()
    scheduledTrackRef.current = null
    performanceStreamRef.current?.getTracks().forEach((track) => track.stop())
    performanceStreamRef.current = null
    performanceRecorderRef.current = null
    const context = audioContextRef.current
    audioContextRef.current = null
    if (context && context.state !== 'closed') await context.close().catch(() => {})
    setPerformanceMode('idle')
    setCountdown(0)
    setPerformanceElapsed(0)
  }, [])

  useEffect(() => () => {
    cleanupPractice()
    void cleanupPerformance()
    if (finalPreviewUrl) URL.revokeObjectURL(finalPreviewUrl)
  }, [cleanupPerformance, cleanupPractice, finalPreviewUrl])

  const latestAttempts = useMemo(
    () => latestAttemptsBySection(data?.attempts ?? []),
    [data?.attempts],
  )

  async function generateSong() {
    setGenerating(true)
    setError('')
    try {
      setData(await apiFetch<MusicStudioData>('/api/user-songs', { method: 'POST' }))
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : String(generateError))
    } finally {
      setGenerating(false)
    }
  }

  function listenToSection(section: PersonalSongSection) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(section.lyrics.replace(/\n/g, '. '))
    utterance.lang = data?.song?.locale ?? 'en-US'
    utterance.rate = 0.78
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  async function analysePracticeBlob(section: PersonalSongSection, blob: Blob) {
    setAnalysingSectionId(section.id)
    setError('')
    try {
      const wav = await recordedBlobToPcmWav(blob)
      const form = new FormData()
      form.append('audio', wav, 'practice.wav')
      form.append('songId', section.song_id)
      form.append('sectionId', section.id)
      const result = await apiFetch<LiveResult>('/api/pronunciation/assess', {
        method: 'POST',
        body: form,
      })
      setLiveResults((current) => ({ ...current, [section.id]: result }))
      await load()
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : String(analysisError))
    } finally {
      setAnalysingSectionId(null)
    }
  }

  async function startPracticeRecording(section: PersonalSongSection) {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador não oferece gravação de áudio. Use uma versão atual do Chrome, Edge, Firefox ou Safari.')
      return
    }

    setError('')
    window.speechSynthesis.cancel()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      const mimeType = supportedRecordingMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.onerror = () => {
        setError('Não foi possível gravar este trecho.')
        cleanupPractice()
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
        cleanupPractice()
        void analysePracticeBlob(section, blob)
      }

      practiceStreamRef.current = stream
      practiceRecorderRef.current = recorder
      setRecordingSectionId(section.id)
      setPracticeSeconds(0)
      const startedAt = Date.now()
      practiceTimerRef.current = setInterval(() => {
        setPracticeSeconds(Math.floor((Date.now() - startedAt) / 1000))
      }, 250)
      practiceAutoStopRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, 25_000)
      recorder.start(250)
    } catch (recordError) {
      cleanupPractice()
      setError(recordError instanceof Error ? recordError.message : 'Permissão de microfone negada.')
    }
  }

  function stopPracticeRecording() {
    const recorder = practiceRecorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }

  function updatePerformanceClock(context: AudioContext, songStart: number, final: boolean) {
    const untilSong = songStart - context.currentTime
    if (untilSong > 0) {
      setCountdown(Math.max(1, Math.ceil(untilSong / (COUNT_IN_SECONDS / 4))))
      setPerformanceMode(final ? 'count-in' : 'rehearsal')
      return
    }
    const elapsed = Math.min(SONG_SECONDS, Math.max(0, context.currentTime - songStart))
    setCountdown(0)
    setPerformanceElapsed(elapsed)
    setPerformanceSection(sectionIndexAt(elapsed))
    setPerformanceMode(final ? 'recording' : 'rehearsal')
  }

  async function startRehearsal() {
    if (!data?.song || performanceMode !== 'idle') return
    setError('')
    const context = new AudioContext()
    await context.resume()
    audioContextRef.current = context
    const track = scheduleBackingTrack(context)
    scheduledTrackRef.current = track
    setPerformanceMode('rehearsal')
    setPerformanceSection(0)
    performanceTimerRef.current = setInterval(
      () => updatePerformanceClock(context, track.songStart, false),
      100,
    )
    performanceStopRef.current = setTimeout(() => {
      void cleanupPerformance()
    }, Math.max(0, (track.endAt - context.currentTime + 0.3) * 1000))
  }

  async function startFinalPerformance() {
    if (!data?.song || performanceMode !== 'idle') return
    if (!consent) {
      setError('Confirme o consentimento de gravação antes de começar.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador não oferece gravação de áudio.')
      return
    }

    setError('')
    if (finalPreviewUrl) URL.revokeObjectURL(finalPreviewUrl)
    setFinalPreviewUrl(null)
    setFinalBlob(null)
    discardPerformanceRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      const context = new AudioContext()
      await context.resume()
      const mixDestination = context.createMediaStreamDestination()
      const mic = context.createMediaStreamSource(stream)
      const micGain = context.createGain()
      micGain.gain.value = 1.05
      mic.connect(micGain).connect(mixDestination)

      const track = scheduleBackingTrack(context, { recordDestination: mixDestination, outputGain: 0.38 })
      const mimeType = supportedRecordingMimeType()
      const recorder = mimeType
        ? new MediaRecorder(mixDestination.stream, { mimeType, audioBitsPerSecond: 128_000 })
        : new MediaRecorder(mixDestination.stream)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.onerror = () => {
        setError('A gravação final foi interrompida pelo navegador.')
        discardPerformanceRef.current = true
        void cleanupPerformance()
      }
      recorder.onstop = () => {
        if (!discardPerformanceRef.current && chunks.length > 0) {
          const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setFinalBlob(blob)
          setFinalPreviewUrl(url)
        }
        void cleanupPerformance()
      }

      audioContextRef.current = context
      performanceStreamRef.current = stream
      performanceRecorderRef.current = recorder
      scheduledTrackRef.current = track
      setPerformanceMode('count-in')
      setPerformanceSection(0)

      performanceTimerRef.current = setInterval(
        () => updatePerformanceClock(context, track.songStart, true),
        100,
      )
      const recorderLeadSeconds = 0.12
      performanceStartRef.current = setTimeout(() => {
        if (recorder.state === 'inactive') recorder.start(250)
      }, Math.max(0, (track.songStart - context.currentTime - recorderLeadSeconds) * 1000))
      performanceStopRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, Math.max(0, (track.endAt - context.currentTime + 0.15) * 1000))
    } catch (recordError) {
      discardPerformanceRef.current = true
      await cleanupPerformance()
      setError(recordError instanceof Error ? recordError.message : 'Não foi possível acessar o microfone.')
    }
  }

  function cancelPerformance() {
    discardPerformanceRef.current = true
    const recorder = performanceRecorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    else void cleanupPerformance()
  }

  async function saveFinalRecording() {
    if (!data?.song || !finalBlob || !consent) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sua sessão expirou. Entre novamente.')
      const extension = extensionForMime(finalBlob.type)
      const uploadMimeType = finalBlob.type.split(';')[0] || 'audio/webm'
      const path = `${user.id}/${data.song.id}/final-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('song-recordings')
        .upload(path, finalBlob, { contentType: uploadMimeType, upsert: false })
      if (uploadError) throw uploadError

      await apiFetch(`/api/user-songs/${data.song.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingPath: path, mimeType: uploadMimeType, consent: true }),
      })
      await load()
      setFinalBlob(null)
      if (finalPreviewUrl) URL.revokeObjectURL(finalPreviewUrl)
      setFinalPreviewUrl(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="music-studio-loading"><span className="spinner" /> Preparing your studio…</div>
  }

  const song = data?.song ?? null
  const sections = song?.sections ?? []
  const currentSection = sections[Math.min(performanceSection, Math.max(0, sections.length - 1))]
  const progress = Math.min(100, ((data?.availableTakeawaysCount ?? 0) / (data?.requiredTakeaways ?? 14)) * 100)

  return (
    <div className="music-studio">
      {error && <div className="alert-error music-studio-error">{error}</div>}

      {!song && (
        <section className="music-unlock-card">
          <div className="music-unlock-copy">
            <span className="mini-label">Your learning becomes music</span>
            <h2>{data?.availableTakeawaysCount ?? 0} of {data?.requiredTakeaways ?? 14} chunks ready</h2>
            <p>
              Complete reviews and write your learnings. Every two chunks become one section;
              fourteen chunks unlock a complete song.
            </p>
            <div className="music-progress-track" aria-label={`${Math.round(progress)}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="music-chunk-grid" aria-hidden="true">
              {Array.from({ length: data?.requiredTakeaways ?? 14 }, (_, index) => (
                <span key={index} className={index < (data?.availableTakeawaysCount ?? 0) ? 'filled' : ''}>
                  {index + 1}
                </span>
              ))}
            </div>
            {(data?.availableTakeawaysCount ?? 0) >= (data?.requiredTakeaways ?? 14) ? (
              <button className="btn-primary" onClick={generateSong} disabled={generating}>
                {generating ? <><span className="spinner" /> Writing your song…</> : 'Create my song'}
              </button>
            ) : (
              <div className="music-unlock-actions">
                <Link href="/review" className="btn-primary">Continue reviews</Link>
                <Link href="/feed" className="btn-secondary">Choose a song</Link>
              </div>
            )}
          </div>
          <div className="music-vinyl" aria-hidden="true"><span>14</span></div>
        </section>
      )}

      {song && (
        <>
          <section className="music-song-head">
            <div>
              <span className="mini-label">Your original learning song</span>
              <h2>{song.title}</h2>
              <p>Lo-fi pop · {song.bpm} BPM · 6 verses + 1 chorus</p>
            </div>
            <span className={`music-status music-status-${song.status}`}>
              {song.status === 'completed' ? 'Completed' : song.status === 'practicing' ? 'Practicing' : 'Ready to practice'}
            </span>
          </section>

          <section className="music-studio-section">
            <div className="music-section-heading">
              <span>01</span>
              <div><h3>Your lyrics</h3><p>Four verses, a chorus, then two final verses.</p></div>
            </div>
            <div className="music-lyrics-grid">
              {sections.map((section) => (
                <article key={section.id} className={section.section_type === 'chorus' ? 'chorus' : ''}>
                  <span>{section.label}</span>
                  <p>{section.lyrics}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="music-studio-section">
            <div className="music-section-heading">
              <span>02</span>
              <div>
                <h3>Pronunciation rehearsal</h3>
                <p>Listen, speak without the instrumental, and improve the highlighted sounds.</p>
              </div>
            </div>

            {!data?.azureConfigured && (
              <div className="music-azure-notice">
                <strong>Azure connection pending</strong>
                <span>Add the free Speech credentials to activate phoneme-level feedback. The rest of the studio is ready.</span>
              </div>
            )}

            <div className="music-section-tabs" role="tablist" aria-label="Song sections">
              {sections.map((section, index) => {
                const liveAttempt = liveResults[section.id]
                const storedAttempt = latestAttempts.get(section.id)
                const score = liveAttempt?.scores?.pronunciation
                  ?? storedAttempt?.overall_scores?.pronunciation
                  ?? section.best_pronunciation_score
                return (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={activeSection === index}
                    className={activeSection === index ? 'active' : ''}
                    onClick={() => setActiveSection(index)}
                  >
                    <span>{section.section_type === 'chorus' ? 'Ch' : index < 4 ? `V${index + 1}` : `V${index}`}</span>
                    {score !== null && score !== undefined && <small style={{ color: scoreColor(Number(score)) }}>{Math.round(Number(score))}</small>}
                  </button>
                )
              })}
            </div>

            {sections[activeSection] && (() => {
              const section = sections[activeSection]
              const currentLive = liveResults[section.id]
              const stored = latestAttempts.get(section.id)
              const scores = currentLive?.scores ?? stored?.overall_scores
              const words = currentLive?.words ?? stored?.word_scores ?? []
              const feedback = currentLive?.feedback ?? stored?.feedback
              const isRecording = recordingSectionId === section.id
              const isAnalysing = analysingSectionId === section.id

              return (
                <div className="music-practice-card">
                  <div className="music-practice-script">
                    <span className="mini-label">{section.label}</span>
                    <p>{section.lyrics}</p>
                    <div className="music-practice-actions">
                      <button type="button" className="btn-secondary" onClick={() => listenToSection(section)} disabled={isRecording}>
                        Hear the line
                      </button>
                      {!isRecording ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => startPracticeRecording(section)}
                          disabled={!data?.azureConfigured || isAnalysing || recordingSectionId !== null}
                        >
                          {isAnalysing ? <><span className="spinner" /> Analysing…</> : 'Record my voice'}
                        </button>
                      ) : (
                        <button type="button" className="music-record-stop" onClick={stopPracticeRecording}>
                          <span /> Stop and analyse · {practiceSeconds}s
                        </button>
                      )}
                    </div>
                    <small>Speak naturally. This recording is analysed and then discarded.</small>
                  </div>

                  {scores ? (
                    <div className="music-practice-result">
                      <div className="music-main-score" style={{ color: scoreColor(scores.pronunciation ?? scores.accuracy) }}>
                        <strong>{Math.round(scores.pronunciation ?? scores.accuracy ?? 0)}</strong>
                        <span>pronunciation</span>
                      </div>
                      <div className="music-score-list">
                        <span><small>Accuracy</small><strong>{Math.round(scores.accuracy ?? 0)}</strong></span>
                        <span><small>Fluency</small><strong>{Math.round(scores.fluency ?? 0)}</strong></span>
                        <span><small>Complete</small><strong>{Math.round(scores.completeness ?? 0)}</strong></span>
                      </div>
                      {feedback && <p>{feedback}</p>}
                      {words.length > 0 && (
                        <div className="music-word-scores">
                          {words.map((word, index) => (
                            <span
                              key={`${word.word}-${index}`}
                              className={(word.accuracy ?? 100) < 75 || word.errorType !== 'None' ? 'needs-work' : 'good'}
                              title={`${word.accuracy ?? 0}% · ${word.errorType}`}
                            >
                              {word.word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="music-practice-empty">
                      <div className="music-sound-wave" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                      <p>Your word-by-word feedback will appear here.</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </section>

          <section className="music-studio-section music-performance-section">
            <div className="music-section-heading">
              <span>03</span>
              <div><h3>Final performance</h3><p>Use headphones, follow the lyrics, and sing over your backing track.</p></div>
            </div>

            <label className="music-consent">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>I agree to record and privately store my voice for this learning activity.</span>
            </label>

            {performanceMode === 'idle' ? (
              <div className="music-performance-actions">
                <button type="button" className="btn-secondary" onClick={startRehearsal}>Rehearse with the beat</button>
                <button type="button" className="btn-primary" onClick={startFinalPerformance} disabled={!consent}>Record final song</button>
              </div>
            ) : (
              <div className="music-live-stage">
                <div className="music-live-meta">
                  <span className={performanceMode === 'recording' ? 'is-recording' : ''}>
                    {performanceMode === 'count-in' ? `Get ready · ${countdown}` : performanceMode === 'recording' ? 'Recording' : countdown > 0 ? `Count in · ${countdown}` : 'Rehearsal'}
                  </span>
                  <button type="button" onClick={cancelPerformance}>Stop</button>
                </div>
                <div className="music-live-lyrics">
                  <small>{currentSection?.label}</small>
                  <p>{currentSection?.lyrics}</p>
                </div>
                <div className="music-live-progress"><span style={{ width: `${Math.min(100, performanceElapsed / SONG_SECONDS * 100)}%` }} /></div>
                <small>{Math.floor(performanceElapsed)}s / {Math.round(SONG_SECONDS)}s</small>
              </div>
            )}

            {finalPreviewUrl && finalBlob && (
              <div className="music-final-preview">
                <div><span className="mini-label">Your new take</span><strong>Listen before saving</strong></div>
                <audio controls src={finalPreviewUrl} />
                <button type="button" className="btn-primary" onClick={saveFinalRecording} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : 'Save to my Library'}
                </button>
              </div>
            )}

            {song.status === 'completed' && song.recording_url && (
              <div className="music-completed-card">
                <div><span>Song completed</span><strong>{song.title}</strong></div>
                <audio controls src={song.recording_url} />
                <p>Your completion is saved and ready for your teacher. You can record another version whenever you want.</p>
              </div>
            )}

            {song.status === 'completed'
              && (data?.availableTakeawaysCount ?? 0) >= (data?.requiredTakeaways ?? 14) && (
                <div className="music-next-song">
                  <div>
                    <strong>Another 14 chunks are ready</strong>
                    <span>You have enough new material for your next original song.</span>
                  </div>
                  <button type="button" className="btn-primary" onClick={generateSong} disabled={generating}>
                    {generating ? <><span className="spinner" /> Writing…</> : 'Create next song'}
                  </button>
                </div>
              )}
          </section>

          {(data?.songHistory.length ?? 0) > 1 && (
            <section className="music-studio-section">
              <div className="music-section-heading">
                <span>♪</span>
                <div><h3>Your previous songs</h3><p>Every group of 14 chunks stays in your personal collection.</p></div>
              </div>
              <div className="music-history-list">
                {data?.songHistory.slice(1).map((historySong) => (
                  <div key={historySong.id}>
                    <div>
                      <strong>{historySong.title}</strong>
                      <small>{historySong.completed_at ? new Date(historySong.completed_at).toLocaleDateString() : 'In progress'}</small>
                    </div>
                    {historySong.recording_url
                      ? <audio controls src={historySong.recording_url} />
                      : <span className="music-status music-status-practicing">{historySong.status}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
