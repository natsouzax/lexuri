'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Day1Read from '@/components/review/Day1Read'
import Day2Memory from '@/components/review/Day2Memory'
import Day3Gaps from '@/components/review/Day3Gaps'
import { getFeedItem } from '@/lib/feed'
import { nextReviewStep, type SongProgress } from '@/lib/mvp'
import { CardsIcon, DayIcon, LevelIcon, MoonIcon } from '@/components/ui/Icons'
import type { Flashcard, TranscriptSegment } from '@/lib/types'
import type { LessonData } from '@/components/LessonView'
import { useLang, type DictKey } from '@/lib/i18n'
import { awardXP } from '@/lib/xp'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Runner do dia de revisão de uma música: decide qual Day está pendente
// e roda a atividade correspondente.
export default function ReviewSongPage() {
  const { t } = useLang()
  const params = useParams<{ songId: string }>()
  const searchParams = useSearchParams()
  const songId = params.songId
  const item = getFeedItem(songId)

  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [progress, setProgress] = useState<SongProgress | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [newVerses, setNewVerses] = useState<string[]>([])
  const [skipWait, setSkipWait] = useState(searchParams.get('now') === '1')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [allCards, prog, lesson] = await Promise.all([
        apiFetch<Flashcard[]>('/api/flashcards'),
        apiFetch<{ progress: SongProgress[] }>('/api/progress'),
        apiFetch<LessonData>(`/api/feed/${songId}/lesson`).catch(() => null),
      ])
      const videoId = lesson?.video_id
      // Palavras desta música; se nada foi salvo com source, usa a biblioteca toda.
      const songCards = allCards.filter((c) => c.source_video === videoId)
      setCards(songCards.length > 0 ? songCards : allCards)
      setSegments(lesson?.segments ?? [])
      setProgress(prog.progress.find((p) => p.song_id === songId) ?? null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoaded(true)
    }
  }, [songId])

  useEffect(() => { load() }, [load])

  async function markDay(day: 1 | 2 | 3) {
    setFinishing(true)
    try {
      const updated = await apiFetch<SongProgress>('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId, action: `day${day}` }),
      })
      setProgress(updated)
      void awardXP('song_review_completed', `song:${songId}:day:${day}`, { songId, day })
    } catch (e) {
      setError(String(e))
    } finally {
      setFinishing(false)
    }
  }

  async function handleTakeaways(texts: string[]) {
    setFinishing(true)
    try {
      const res = await apiFetch<{ saved: number; newVerses: string[] }>('/api/takeaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId, texts }),
      })
      setNewVerses(res.newVerses)
      await apiFetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: songId, action: 'day3' }),
      })
      if (res.saved > 0) {
        void awardXP('takeaway_created', `takeaways:${songId}:day3`, { songId, count: res.saved })
      }
      void awardXP('song_review_completed', `song:${songId}:day:3`, { songId, day: 3 })
    } finally {
      setFinishing(false)
    }
  }

  if (!item) {
    return (
      <div className="card lesson-state-card">
        <p className="lesson-state-title">{t('lesson.notFound')}</p>
        <div className="lesson-state-actions">
          <Link href="/review" className="btn-secondary">{t('runner.back')}</Link>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="lesson-loading">
        <span className="spinner" />
        <span>{t('runner.preparing')}</span>
      </div>
    )
  }

  const rawStep = progress ? nextReviewStep(progress) : { day: 1 as const, available: true }
  // O usuário pode escolher avançar o dia sem esperar o intervalo.
  const step = rawStep === 'done' || rawStep.available || !skipWait
    ? rawStep
    : { day: rawStep.day, available: true }
  const noCards = !cards || cards.length === 0

  return (
    <>
      <div className="app-hero promo-banner">
        <span className="promo-sparkle promo-sparkle-1">✦</span>
        <span className="promo-sparkle promo-sparkle-2">✦</span>
        <span className="promo-sparkle promo-sparkle-3">✦</span>

        <div className="lesson-meta-row">
          <Link href="/review" className="lesson-meta-chip">{t('runner.back')}</Link>
          {step !== 'done' && (
            <span className="lesson-meta-chip">
              <DayIcon day={step.day} size={13} /> Day {step.day}
            </span>
          )}
          <span className="lesson-meta-chip is-muted">{item.title}</span>
        </div>

        <h1 className="app-hero-title">
          {step === 'done' ? `${item.title} — ${t('runner.cycleDone')}` : t(`day${step.day}.title` as DictKey)}
        </h1>
        <p className="app-hero-subtitle">
          {step === 'done' ? t('runner.cycleDoneSub') : `${item.title} · ${item.artist ?? ''}`}
        </p>
      </div>

      <div className="stat-pill-row">
        <div className="stat-pill">
          <span className="stat-pill-icon clay">
            {step === 'done' ? <DayIcon day={3} size={17} /> : <DayIcon day={step.day} size={17} />}
          </span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{step === 'done' ? 'Complete' : `Day ${step.day} of 3`}</span>
            <span className="stat-pill-label">Review cycle</span>
          </span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-icon butter"><CardsIcon size={17} /></span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{cards?.length ?? 0} words</span>
            <span className="stat-pill-label">Saved from this song</span>
          </span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}>
            <LevelIcon level={item.level.startsWith('A') ? 'beginner' : item.level.startsWith('B') ? 'intermediate' : 'advanced'} size={17} />
          </span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{item.level}</span>
            <span className="stat-pill-label">Song level</span>
          </span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {step === 'done' && newVerses.length === 0 && (
        <div className="review-actions">
          <Link href="/feed" className="btn-primary">{t('runner.nextSong')}</Link>
        </div>
      )}

      {step !== 'done' && !step.available && (
        <div className="card lesson-state-card">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--muted)', marginBottom: 8 }}><MoonIcon size={32} /></div>
          <p className="lesson-state-title">{t('runner.locked.title')}</p>
          <p className="lesson-state-body">
            {t('runner.locked.body')} {t(`day${step.day}.title` as DictKey)}.
          </p>
          <div className="lesson-state-actions">
            <Link href="/feed" className="btn-secondary">{t('runner.locked.back')}</Link>
            <button className="btn-primary" onClick={() => setSkipWait(true)}>{t('runner.skipWait')}</button>
          </div>
        </div>
      )}

      {step !== 'done' && step.available && noCards && (
        <div className="card lesson-state-card">
          <p className="lesson-state-title">{t('runner.noWords.title')}</p>
          <p className="lesson-state-body">{t('runner.noWords.body')}</p>
          <div className="lesson-state-actions">
            <Link href={`/feed/${songId}`} className="btn-primary">{t('runner.noWords.cta')}</Link>
          </div>
        </div>
      )}

      {step !== 'done' && step.available && !noCards && (
        <>
          {step.day === 1 && <Day1Read cards={cards!} onDone={() => markDay(1)} finishing={finishing} />}
          {step.day === 2 && <Day2Memory cards={cards!} onDone={() => markDay(2)} finishing={finishing} />}
          {step.day === 3 && (
            <Day3Gaps
              cards={cards!}
              segments={segments}
              onSubmitTakeaways={handleTakeaways}
              finishing={finishing}
              newVerses={newVerses}
            />
          )}
        </>
      )}
    </>
  )
}
