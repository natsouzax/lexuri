'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getNativeLangName } from '@/lib/i18n'
import {
  recordedBlobToPcmWav,
  supportedRecordingMimeType,
  extensionForMime,
} from '@/lib/music/audio'
import {
  BACKING_SONG_START_SECONDS,
  BACKING_TOTAL_SECONDS,
  COUNT_IN_SECONDS,
  SONG_SECONDS,
  renderBackingTrackWav,
  sectionIndexAt,
} from '@/lib/music/backing-track'
import type {
  MusicStudioData,
  PersonalSongSection,
  PronunciationAttempt,
  PronunciationResult,
  SongPerformanceAssessment,
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

async function ensureAudioContextRunning(context: AudioContext, errorMessage: string) {
  if (context.state !== 'running') await context.resume()
  if ((context.state as AudioContextState) !== 'running') throw new Error(errorMessage)
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

type PerformanceMode = 'idle' | 'preparing' | 'ready' | 'rehearsal' | 'count-in' | 'recording'

export default function MusicStudio() {
  const [data, setData] = useState<MusicStudioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const [recordingSectionId, setRecordingSectionId] = useState<string | null>(null)
  const [analysingSectionId, setAnalysingSectionId] = useState<string | null>(null)
  const [liveResults, setLiveResults] = useState<Record<string, LiveResult>>({})
  const [practicePreviewUrls, setPracticePreviewUrls] = useState<Record<string, string>>({})
  const [practiceSeconds, setPracticeSeconds] = useState(0)
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('idle')
  const [performanceSection, setPerformanceSection] = useState(0)
  const [performanceElapsed, setPerformanceElapsed] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [backingAudioUrl, setBackingAudioUrl] = useState<string | null>(null)
  const [backingAudioPreparing, setBackingAudioPreparing] = useState(false)
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null)
  const [analysingFinal, setAnalysingFinal] = useState(false)
  const [finalAssessmentOverride, setFinalAssessmentOverride] = useState<SongPerformanceAssessment | null | undefined>(undefined)
  const [savingSpeakingWords, setSavingSpeakingWords] = useState(false)
  const [savedSpeakingWords, setSavedSpeakingWords] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [consent, setConsent] = useState(false)

  const practiceRecorderRef = useRef<MediaRecorder | null>(null)
  const practiceStreamRef = useRef<MediaStream | null>(null)
  const practiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const practiceAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const practicePreviewUrlsRef = useRef<Record<string, string>>({})

  const audioContextRef = useRef<AudioContext | null>(null)
  const backingMonitorRef = useRef<HTMLAudioElement | null>(null)
  const backingAudioBlobRef = useRef<Blob | null>(null)
  const backingAudioUrlRef = useRef<string | null>(null)
  const finalPreviewUrlRef = useRef<string | null>(null)
  const performanceStreamRef = useRef<MediaStream | null>(null)
  const performanceMixDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const performanceBackingBufferRef = useRef<AudioBuffer | null>(null)
  const performanceBackingSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const performanceRecorderRef = useRef<MediaRecorder | null>(null)
  const performanceVoiceRecorderRef = useRef<MediaRecorder | null>(null)
  const performanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const performanceStartRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const performanceStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    const backingSource = performanceBackingSourceRef.current
    performanceBackingSourceRef.current = null
    if (backingSource) {
      backingSource.onended = null
      try { backingSource.stop() } catch { /* already stopped */ }
      try { backingSource.disconnect() } catch { /* already disconnected */ }
    }
    performanceStreamRef.current?.getTracks().forEach((track) => track.stop())
    performanceStreamRef.current = null
    performanceMixDestinationRef.current = null
    performanceBackingBufferRef.current = null
    performanceRecorderRef.current = null
    performanceVoiceRecorderRef.current = null
    const monitor = backingMonitorRef.current
    if (monitor) {
      monitor.onended = null
      monitor.pause()
      monitor.srcObject = null
      monitor.currentTime = 0
    }
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
    if (finalPreviewUrlRef.current) URL.revokeObjectURL(finalPreviewUrlRef.current)
    finalPreviewUrlRef.current = null
    Object.values(practicePreviewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    practicePreviewUrlsRef.current = {}
  }, [cleanupPerformance, cleanupPractice])

  const songId = data?.song?.id
  useEffect(() => {
    setFinalAssessmentOverride(undefined)
    setSavedSpeakingWords(null)
  }, [songId])

  useEffect(() => {
    if (!songId) {
      setBackingAudioPreparing(false)
      return
    }

    let cancelled = false
    const previousUrl = backingAudioUrlRef.current
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    backingAudioBlobRef.current = null
    backingAudioUrlRef.current = null
    setBackingAudioUrl(null)
    setBackingAudioPreparing(true)

    void renderBackingTrackWav()
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        backingAudioBlobRef.current = blob
        backingAudioUrlRef.current = url
        setBackingAudioUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível preparar a música de fundo neste navegador.')
      })
      .finally(() => {
        if (!cancelled) setBackingAudioPreparing(false)
      })

    return () => {
      cancelled = true
      const currentUrl = backingAudioUrlRef.current
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      backingAudioBlobRef.current = null
      backingAudioUrlRef.current = null
    }
  }, [songId])

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

  function keepPracticePreview(sectionId: string, blob: Blob) {
    const previousUrl = practicePreviewUrlsRef.current[sectionId]
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    const nextUrl = URL.createObjectURL(blob)
    practicePreviewUrlsRef.current = {
      ...practicePreviewUrlsRef.current,
      [sectionId]: nextUrl,
    }
    setPracticePreviewUrls((current) => ({ ...current, [sectionId]: nextUrl }))
  }

  function clearFinalPreview() {
    if (finalPreviewUrlRef.current) URL.revokeObjectURL(finalPreviewUrlRef.current)
    finalPreviewUrlRef.current = null
    setFinalPreviewUrl(null)
    setFinalBlob(null)
  }

  async function analyseFinalPerformance(songId: string, voiceBlob: Blob) {
    setAnalysingFinal(true)
    setError('')
    try {
      const extension = extensionForMime(voiceBlob.type)
      const form = new FormData()
      form.append('audio', voiceBlob, `final-voice.${extension}`)
      form.append('songId', songId)
      form.append('nativeLanguage', getNativeLangName())
      const assessment = await apiFetch<SongPerformanceAssessment>('/api/pronunciation/assess-song', {
        method: 'POST',
        body: form,
      })
      setFinalAssessmentOverride(assessment)
    } catch (analysisError) {
      setError(analysisError instanceof Error
        ? `A gravação ficou pronta, mas a análise falhou: ${analysisError.message}`
        : 'A gravação ficou pronta, mas não foi possível analisar a performance.')
    } finally {
      setAnalysingFinal(false)
    }
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
      form.append('nativeLanguage', getNativeLangName())
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
        if (blob.size === 0) {
          setError('A gravação ficou vazia. Tente novamente e mantenha o microfone ativo.')
          return
        }
        keepPracticePreview(section.id, blob)
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

  function updatePerformanceClock(playbackSeconds: number, final: boolean) {
    const untilSong = BACKING_SONG_START_SECONDS - playbackSeconds
    if (untilSong > 0) {
      setCountdown(Math.max(1, Math.ceil(untilSong / (COUNT_IN_SECONDS / 4))))
      setPerformanceMode(final ? 'count-in' : 'rehearsal')
      return
    }
    const elapsed = Math.min(SONG_SECONDS, Math.max(0, playbackSeconds - BACKING_SONG_START_SECONDS))
    setCountdown(0)
    setPerformanceElapsed(elapsed)
    setPerformanceSection(sectionIndexAt(elapsed))
    setPerformanceMode(final ? 'recording' : 'rehearsal')
  }

  async function startRehearsal() {
    if (!data?.song || !backingAudioUrl || performanceMode !== 'idle') return
    setError('')
    const monitor = backingMonitorRef.current
    if (!monitor) return

    try {
      monitor.currentTime = 0
      monitor.volume = 0.9
      monitor.onended = () => { void cleanupPerformance() }
      await monitor.play()
      setPerformanceMode('rehearsal')
      setPerformanceSection(0)
      updatePerformanceClock(monitor.currentTime, false)
      performanceTimerRef.current = setInterval(
        () => updatePerformanceClock(monitor.currentTime, false),
        100,
      )
    } catch {
      await cleanupPerformance()
      setError('O navegador bloqueou a música de fundo. Toque novamente em “Rehearse with the beat”.')
    }
  }

  function stopPerformanceRecorders(): boolean {
    let stopped = false
    for (const recorder of [performanceRecorderRef.current, performanceVoiceRecorderRef.current]) {
      if (recorder?.state === 'recording') {
        recorder.stop()
        stopped = true
      }
    }
    return stopped
  }

  async function startFinalPerformance() {
    if (!data?.song || !backingAudioUrl || performanceMode !== 'idle') return
    const performanceSongId = data.song.id
    if (!consent) {
      setError('Confirme o consentimento de gravação antes de começar.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador não oferece gravação de áudio.')
      return
    }

    setError('')
    clearFinalPreview()
    setFinalAssessmentOverride(null)
    discardPerformanceRef.current = false
    setPerformanceMode('preparing')

    try {
      const backingBlob = backingAudioBlobRef.current
      if (!backingBlob) throw new Error('A música de fundo ainda não ficou pronta.')
      const context = new AudioContext()
      audioContextRef.current = context
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      performanceStreamRef.current = stream
      performanceBackingBufferRef.current = await context.decodeAudioData(
        await backingBlob.arrayBuffer(),
      )

      const mixDestination = context.createMediaStreamDestination()
      const voiceDestination = context.createMediaStreamDestination()
      performanceMixDestinationRef.current = mixDestination
      const mic = context.createMediaStreamSource(stream)
      const micGain = context.createGain()
      micGain.gain.value = 1.05
      mic.connect(micGain)
      micGain.connect(mixDestination)
      micGain.connect(voiceDestination)

      const mimeType = supportedRecordingMimeType()
      const recorder = mimeType
        ? new MediaRecorder(mixDestination.stream, { mimeType, audioBitsPerSecond: 128_000 })
        : new MediaRecorder(mixDestination.stream)
      const voiceRecorder = mimeType
        ? new MediaRecorder(voiceDestination.stream, { mimeType, audioBitsPerSecond: 96_000 })
        : new MediaRecorder(voiceDestination.stream)
      const finalChunks: BlobPart[] = []
      const voiceChunks: BlobPart[] = []
      let finalStopped = false
      let voiceStopped = false

      const finishPerformance = () => {
        if (!finalStopped || !voiceStopped) return
        if (!discardPerformanceRef.current && finalChunks.length > 0) {
          const blob = new Blob(finalChunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
          const url = URL.createObjectURL(blob)
          finalPreviewUrlRef.current = url
          setFinalBlob(blob)
          setFinalPreviewUrl(url)

          if (voiceChunks.length > 0) {
            const voiceBlob = new Blob(voiceChunks, {
              type: voiceRecorder.mimeType || mimeType || 'audio/webm',
            })
            void analyseFinalPerformance(performanceSongId, voiceBlob)
          } else {
            setError('A música ficou pronta, mas a faixa de voz estava vazia e não pôde ser analisada.')
          }
        }
        void cleanupPerformance()
      }
      const handleRecorderError = () => {
        setError('A gravação final foi interrompida pelo navegador.')
        discardPerformanceRef.current = true
        stopPerformanceRecorders()
        void cleanupPerformance()
      }
      recorder.ondataavailable = (event) => { if (event.data.size > 0) finalChunks.push(event.data) }
      voiceRecorder.ondataavailable = (event) => { if (event.data.size > 0) voiceChunks.push(event.data) }
      recorder.onerror = handleRecorderError
      voiceRecorder.onerror = handleRecorderError
      recorder.onstop = () => {
        finalStopped = true
        finishPerformance()
      }
      voiceRecorder.onstop = () => {
        voiceStopped = true
        finishPerformance()
      }

      performanceRecorderRef.current = recorder
      performanceVoiceRecorderRef.current = voiceRecorder
      setPerformanceMode('ready')
      setPerformanceSection(0)
    } catch (recordError) {
      discardPerformanceRef.current = true
      setFinalAssessmentOverride(undefined)
      await cleanupPerformance()
      setError(recordError instanceof Error ? recordError.message : 'Não foi possível acessar o microfone.')
    }
  }

  async function beginFinalPerformance() {
    if (performanceMode !== 'ready') return
    const context = audioContextRef.current
    const mixDestination = performanceMixDestinationRef.current
    const backingBuffer = performanceBackingBufferRef.current
    const recorder = performanceRecorderRef.current
    const voiceRecorder = performanceVoiceRecorderRef.current
    if (!context || !mixDestination || !backingBuffer || !recorder || !voiceRecorder) {
      setError('A gravação não ficou pronta. Tente preparar o microfone novamente.')
      await cleanupPerformance()
      return
    }

    setError('')
    discardPerformanceRef.current = false
    try {
      await (context.state === 'running' ? Promise.resolve() : context.resume())
      await ensureAudioContextRunning(
        context,
        'O navegador bloqueou o áudio. Toque novamente em “Start performance”.',
      )

      // One source feeds both destinations. What the user hears is the exact
      // backing track written into the final MediaRecorder stream.
      const source = context.createBufferSource()
      const speakerGain = context.createGain()
      const recordingGain = context.createGain()
      source.buffer = backingBuffer
      speakerGain.gain.value = 0.95
      recordingGain.gain.value = 0.82
      source.connect(speakerGain).connect(context.destination)
      source.connect(recordingGain).connect(mixDestination)
      performanceBackingSourceRef.current = source

      const backingStartAt = context.currentTime + 0.08
      const songStartAt = backingStartAt + BACKING_SONG_START_SECONDS
      const songEndAt = songStartAt + SONG_SECONDS
      source.start(backingStartAt)

      setPerformanceMode('count-in')
      setPerformanceSection(0)
      updatePerformanceClock(0, true)
      performanceTimerRef.current = setInterval(
        () => updatePerformanceClock(Math.max(0, context.currentTime - backingStartAt), true),
        100,
      )

      source.onended = () => {
        if (!stopPerformanceRecorders()) void cleanupPerformance()
      }
      const recorderLeadSeconds = 0.12
      performanceStartRef.current = setTimeout(() => {
        try {
          if (recorder.state === 'inactive') recorder.start(250)
          if (voiceRecorder.state === 'inactive') voiceRecorder.start(250)
        } catch {
          discardPerformanceRef.current = true
          setError('O navegador não conseguiu iniciar as duas faixas de gravação.')
          stopPerformanceRecorders()
          void cleanupPerformance()
        }
      }, Math.max(0, (songStartAt - context.currentTime - recorderLeadSeconds) * 1000))
      performanceStopRef.current = setTimeout(() => {
        stopPerformanceRecorders()
      }, Math.max(0, (Math.min(songEndAt + 0.15, backingStartAt + BACKING_TOTAL_SECONDS) - context.currentTime) * 1000))
    } catch (recordError) {
      discardPerformanceRef.current = true
      setFinalAssessmentOverride(undefined)
      await cleanupPerformance()
      setError(recordError instanceof Error ? recordError.message : 'Não foi possível tocar a música de fundo.')
    }
  }

  function cancelPerformance() {
    discardPerformanceRef.current = true
    setFinalAssessmentOverride(undefined)
    if (!stopPerformanceRecorders()) void cleanupPerformance()
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
      clearFinalPreview()
      setFinalAssessmentOverride(undefined)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function saveSpeakingPracticeWords() {
    if (!data?.song) return
    setSavingSpeakingWords(true)
    setError('')
    try {
      const response = await apiFetch<{ savedCount: number }>('/api/speaking-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: data.song.id }),
      })
      setSavedSpeakingWords(response.savedCount)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError))
    } finally {
      setSavingSpeakingWords(false)
    }
  }

  if (loading) {
    return <div className="music-studio-loading"><span className="spinner" /> Preparing your studio…</div>
  }

  const song = data?.song ?? null
  const performanceAssessment = finalAssessmentOverride === undefined
    ? song?.performance_assessment ?? null
    : finalAssessmentOverride
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
                <h3>Clarity rehearsal</h3>
                <p>Listen, speak without the instrumental, and improve the words the AI could not understand.</p>
              </div>
            </div>

            {!data?.speechAnalysisConfigured && (
              <div className="music-analysis-notice">
                <strong>Voice analysis unavailable</strong>
                <span>Configure the same OpenAI key used by Lexuri to activate word-level clarity feedback.</span>
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
              const practicePreviewUrl = practicePreviewUrls[section.id]

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
                          disabled={!data?.speechAnalysisConfigured || isAnalysing || recordingSectionId !== null}
                        >
                          {isAnalysing
                            ? <><span className="spinner" /> Analysing…</>
                            : practicePreviewUrl ? 'Record again' : 'Record my voice'}
                        </button>
                      ) : (
                        <button type="button" className="music-record-stop" onClick={stopPracticeRecording}>
                          <span /> Stop and analyse · {practiceSeconds}s
                        </button>
                      )}
                    </div>
                    {practicePreviewUrl && !isRecording && (
                      <div className="music-practice-playback">
                        <div>
                          <strong>Listen to your recording</strong>
                          <span>Kept only in this browser tab.</span>
                        </div>
                        <audio
                          controls
                          preload="metadata"
                          src={practicePreviewUrl}
                          aria-label={`Your recording for ${section.label}`}
                        />
                      </div>
                    )}
                    <small>OpenAI receives a temporary copy for transcription. Lexuri does not save this practice audio.</small>
                  </div>

                  {scores ? (
                    <div className="music-practice-result">
                      <div className="music-main-score" style={{ color: scoreColor(scores.pronunciation ?? scores.accuracy) }}>
                        <strong>{Math.round(scores.pronunciation ?? scores.accuracy ?? 0)}</strong>
                        <span>clarity</span>
                      </div>
                      <div className="music-score-list">
                        <span><small>Word match</small><strong>{Math.round(scores.accuracy ?? 0)}</strong></span>
                        <span><small>Complete</small><strong>{Math.round(scores.completeness ?? 0)}</strong></span>
                        <span><small>AI confidence</small><strong>{scores.confidence === null || scores.confidence === undefined ? '—' : Math.round(scores.confidence)}</strong></span>
                      </div>
                      {feedback && <p>{feedback}</p>}
                      {words.length > 0 && (
                        <div className="music-word-scores">
                          {words.map((word, index) => (
                            <span
                              key={`${word.word}-${index}`}
                              className={(word.accuracy ?? 100) < 75 || word.errorType !== 'None' ? 'needs-work' : 'good'}
                              title={`${word.accuracy ?? 0}% · ${word.errorType}${word.recognizedWord && word.errorType !== 'None' ? ` · heard as ${word.recognizedWord}` : ''}`}
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
                      <p>Your word-by-word clarity feedback will appear here.</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </section>

          <section className="music-studio-section music-performance-section">
            <div className="music-section-heading">
              <span>03</span>
              <div><h3>Final performance</h3><p>Use headphones and sing over the backing track. Recording stops automatically and shows a preview before saving.</p></div>
            </div>

            <audio
              ref={backingMonitorRef}
              className="music-backing-monitor"
              src={backingAudioUrl ?? undefined}
              preload="auto"
              playsInline
              aria-hidden="true"
            />

            <label className="music-consent">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>I agree to record and privately store my voice for this learning activity.</span>
            </label>
            <p className="music-bluetooth-note" role="note">
              <span aria-hidden="true">ⓘ</span>
              Bluetooth headphones may lose the backing track when the microphone starts. For best results, use wired headphones.
            </p>

            {performanceMode === 'idle' ? (
              <div className="music-performance-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={startRehearsal}
                  disabled={backingAudioPreparing || !backingAudioUrl}
                >
                  {backingAudioPreparing ? 'Preparing backing track…' : 'Rehearse with the beat'}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={startFinalPerformance}
                  disabled={!consent || backingAudioPreparing || !backingAudioUrl}
                >
                  Record final song
                </button>
              </div>
            ) : (
              <div className="music-live-stage">
                <div className="music-live-meta">
                  <span className={performanceMode === 'recording' ? 'is-recording' : ''}>
                    {performanceMode === 'preparing'
                      ? 'Preparing microphone'
                      : performanceMode === 'ready'
                        ? 'Microphone ready'
                        : performanceMode === 'count-in'
                          ? `Get ready · ${countdown}`
                          : performanceMode === 'recording'
                            ? 'Recording voice + backing track'
                            : countdown > 0 ? `Count in · ${countdown}` : 'Rehearsal'}
                  </span>
                  <button type="button" onClick={cancelPerformance}>Stop</button>
                </div>
                {performanceMode === 'ready' ? (
                  <div className="music-live-ready">
                    <strong>Put on your headphones and get ready.</strong>
                    <span>The count-in and backing track will start with the next click.</span>
                    <button type="button" className="btn-primary" onClick={beginFinalPerformance}>
                      Start performance
                    </button>
                  </div>
                ) : (
                  <div className="music-live-lyrics">
                    <small>{currentSection?.label}</small>
                    <p>{currentSection?.lyrics}</p>
                  </div>
                )}
                <div className="music-live-progress"><span style={{ width: `${Math.min(100, performanceElapsed / SONG_SECONDS * 100)}%` }} /></div>
                <small>{Math.floor(performanceElapsed)}s / {Math.round(SONG_SECONDS)}s</small>
              </div>
            )}

            {finalPreviewUrl && finalBlob && (
              <div className="music-final-preview">
                <div><span className="mini-label">Your new take</span><strong>Listen before saving</strong></div>
                <audio controls src={finalPreviewUrl} />
                <button type="button" className="btn-primary" onClick={saveFinalRecording} disabled={saving || analysingFinal}>
                  {saving ? <><span className="spinner" /> Saving…</> : 'Save to my Library'}
                </button>
              </div>
            )}

            {analysingFinal && (
              <div className="music-final-analysis-loading" role="status" aria-live="polite">
                <span className="spinner" />
                <div>
                  <strong>Analysing your complete performance…</strong>
                  <span>The AI is checking what it understood across the whole song.</span>
                </div>
              </div>
            )}

            {performanceAssessment && !analysingFinal && (
              <div className="music-final-assessment">
                <div className="music-final-assessment-head">
                  <div>
                    <span className="mini-label">Complete song feedback</span>
                    <h4>What the AI understood</h4>
                    <p>{performanceAssessment.feedback}</p>
                  </div>
                  <div
                    className="music-final-score"
                    style={{ color: scoreColor(performanceAssessment.scores.pronunciation) }}
                  >
                    <strong>{Math.round(performanceAssessment.scores.pronunciation ?? 0)}</strong>
                    <span>clarity</span>
                  </div>
                </div>

                <div className="music-final-metrics">
                  <span><small>Word match</small><strong>{Math.round(performanceAssessment.scores.accuracy ?? 0)}%</strong></span>
                  <span><small>Complete</small><strong>{Math.round(performanceAssessment.scores.completeness ?? 0)}%</strong></span>
                  <span><small>AI confidence</small><strong>{performanceAssessment.scores.confidence == null ? '—' : `${Math.round(performanceAssessment.scores.confidence)}%`}</strong></span>
                </div>

                <div className="music-final-sections">
                  {performanceAssessment.sections.map((section) => (
                    <div key={section.sectionId}>
                      <span>{section.label}</span>
                      <strong>{Math.round(section.score)}%</strong>
                      <div><i style={{ width: `${section.score}%` }} /></div>
                      <small>{section.understoodCount}/{section.totalWords} words</small>
                    </div>
                  ))}
                </div>

                <div className="music-final-transcript">
                  <span>AI transcript</span>
                  <p>{performanceAssessment.recognizedText || 'No speech was recognized.'}</p>
                </div>

                <div className="music-final-word-groups">
                  <div>
                    <strong>Clearly understood</strong>
                    <div className="music-word-scores">
                      {performanceAssessment.words
                        .filter((word) => word.errorType === 'None')
                        .map((word, index) => <span className="good" key={`${word.word}-good-${index}`}>{word.word}</span>)}
                    </div>
                  </div>
                  <div>
                    <strong>Practice next</strong>
                    {performanceAssessment.focusWords.length > 0 ? (
                      <div>
                        <div className="music-word-scores">
                          {performanceAssessment.focusWords.map((word, index) => (
                            <span className="needs-work" key={`${word.word}-focus-${index}`}>
                              {word.recognizedWord ? `${word.word} → ${word.recognizedWord}` : `${word.word} · not heard`}
                            </span>
                          ))}
                        </div>
                        <div className="music-speaking-save">
                          {savedSpeakingWords === null ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={saveSpeakingPracticeWords}
                              disabled={savingSpeakingWords}
                            >
                              {savingSpeakingWords
                                ? <><span className="spinner" /> Saving…</>
                                : 'Save words to speaking practice'}
                            </button>
                          ) : (
                            <span>✓ {savedSpeakingWords} {savedSpeakingWords === 1 ? 'word is' : 'words are'} ready</span>
                          )}
                          {savedSpeakingWords !== null && (
                            <Link href="/speaking-review" className="btn-primary">Start speaking practice →</Link>
                          )}
                        </div>
                      </div>
                    ) : <p>Every expected word was understood.</p>}
                  </div>
                </div>
              </div>
            )}

            {song.status === 'completed' && song.recording_url && (
              <div className="music-completed-card">
                <div><span>Song completed</span><strong>{song.title}</strong></div>
                <audio controls src={song.recording_url} />
                <p>Your recording and feedback are saved in your Library. Teacher review remains an optional extra.</p>
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
