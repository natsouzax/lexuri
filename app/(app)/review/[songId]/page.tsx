'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Day1Read from '@/components/review/Day1Read'
import Day2Memory from '@/components/review/Day2Memory'
import Day3Gaps from '@/components/review/Day3Gaps'
import { getFeedItem } from '@/lib/feed'
import { DAY_INFO, nextReviewStep, type SongProgress } from '@/lib/mvp'
import type { Flashcard, TranscriptSegment } from '@/lib/types'
import type { LessonData } from '@/components/LessonView'
import { useLang, type DictKey } from '@/lib/i18n'

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
  const songId = params.songId
  const item = getFeedItem(songId)

  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [progress, setProgress] = useState<SongProgress | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [newVerses, setNewVerses] = useState<string[]>([])
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
    } catch (e) {
      setError(String(e))
    } finally {
      setFinishing(false)
    }
  }

  async function handleTakeaways(texts: string[]) {
    setFinishing(true)
    try {
      const res = await apiFetch<{ newVerses: string[] }>('/api/takeaways', {
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
    } finally {
      setFinishing(false)
    }
  }

  if (!item) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">{t('lesson.notFound')}</div>
        <Link href="/review" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>{t('runner.back')}</Link>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--muted)' }}>
        <span className="spinner" />
        <span>{t('runner.preparing')}</span>
      </div>
    )
  }

  const step = progress ? nextReviewStep(progress) : { day: 1 as const, available: true }
  const noCards = !cards || cards.length === 0

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/review" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>{t('runner.back')}</Link>
      </div>

      <div className="app-hero" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 className="app-hero-title">
          {step === 'done' ? `${item.title} — ${t('runner.cycleDone')}` : t(`day${step.day}.title` as DictKey)}
        </h1>
        <p className="app-hero-subtitle">
          {step === 'done' ? t('runner.cycleDoneSub') : `${item.title} · ${item.artist ?? ''}`}
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {step === 'done' && newVerses.length === 0 && (
        <div style={{ textAlign: 'center' }}>
          <Link href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>{t('runner.nextSong')}</Link>
        </div>
      )}

      {step !== 'done' && !step.available && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🌙</p>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
            {t('runner.locked.title')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
            {t('runner.locked.body')} {t(`day${step.day}.title` as DictKey)}.
          </p>
          <Link href="/feed" className="btn-secondary" style={{ textDecoration: 'none' }}>{t('runner.locked.back')}</Link>
        </div>
      )}

      {step !== 'done' && step.available && noCards && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
            {t('runner.noWords.title')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
            {t('runner.noWords.body')}
          </p>
          <Link href={`/feed/${songId}`} className="btn-primary" style={{ textDecoration: 'none' }}>{t('runner.noWords.cta')}</Link>
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
