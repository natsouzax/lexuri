'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeedItem } from '@/lib/feed'
import { DAY_INFO, nextReviewStep, type SongProgress } from '@/lib/mvp'
import { useLang, type DictKey } from '@/lib/i18n'
import SrsSession from '@/components/review/SrsSession'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'
import { FlameIcon, BookIcon, CheckCircleIcon, DayIcon } from '@/components/ui/Icons'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Visão geral do ciclo de revisão: pra cada música ouvida, mostra qual
// Day está pendente (ou se o ciclo terminou).
export default function ReviewPage() {
  const { t } = useLang()
  const [progress, setProgress] = useState<SongProgress[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dueCount, setDueCount] = useState(0)
  const [oldestAgo, setOldestAgo] = useState(0)

  useEffect(() => {
    apiFetch<{ progress: SongProgress[] }>('/api/progress')
      .then((d) => setProgress(d.progress))
      .catch(() => {})
      .finally(() => setLoaded(true))

    apiFetch<Flashcard[]>('/api/flashcards')
      .then(async (cards) => {
        const { getDueCards } = await import('@/lib/srs')
        const due = getDueCards(cards)
        setDueCount(due.length)
        if (due.length > 0) {
          const oldest = due.reduce((a, b) =>
            new Date(a.next_review) < new Date(b.next_review) ? a : b
          )
          const daysAgo = Math.floor((Date.now() - new Date(oldest.next_review).getTime()) / 86_400_000)
          setOldestAgo(Math.max(0, daysAgo))
        }
      })
      .catch(() => {})
  }, [])

  const rows = progress
    .map((p) => ({ p, item: getFeedItem(p.song_id), step: nextReviewStep(p) }))
    .filter((r) => r.item)

  const pending = rows.filter((r) => r.step !== 'done')
  const completed = rows.filter((r) => r.step === 'done')

  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <h1 className="app-hero-title">{t('review.title')}</h1>
          <p className="app-hero-subtitle">{t('review.subtitle')}</p>
        </div>

        <div className="stat-pill-row">
          <div className="stat-pill">
            <span className="stat-pill-icon clay"><FlameIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{dueCount} Due</span>
              <span className="stat-pill-label">
                {dueCount > 0 && oldestAgo > 0 ? `Oldest waited ${oldestAgo}d` : 'Flashcards to review'}
              </span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon butter"><BookIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{pending.length} Pending</span>
              <span className="stat-pill-label">Songs in progress</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}><CheckCircleIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{completed.length} Done</span>
              <span className="stat-pill-label">Full cycle finished</span>
            </span>
          </div>
        </div>

        <SrsSession />

        {loaded && rows.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
              {t('review.empty.title')}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>
              {t('review.empty.body')}
            </p>
            <Link href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>{t('review.empty.cta')}</Link>
          </div>
        )}

        {pending.length > 0 && (
          <>
            <div className="section-title">{t('review.pending')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {pending.map(({ p, item, step }) => {
                if (step === 'done' || !item) return null
                const info = DAY_INFO[step.day]
                return (
                  <div key={p.song_id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--clay)', display: 'flex' }}><DayIcon day={step.day} size={22} /></span>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900 }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t(`day${step.day}.title` as DictKey)} — {t(`day${step.day}.desc` as DictKey)}</div>
                    </div>
                    {step.available ? (
                      <Link href={`/review/${p.song_id}`} className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        {t('review.doNow')}
                      </Link>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {t('review.tomorrow')}
                        </span>
                        <Link href={`/review/${p.song_id}?now=1`} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clay)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          {t('runner.skipWait')}
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <div className="section-title">{t('review.completed')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completed.map(({ p, item }) => item && (
                <div key={p.song_id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.8 }}>
                  <span style={{ color: 'var(--moss)', display: 'flex' }}><CheckCircleIcon size={19} /></span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800 }}>{item.title}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>{item.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ProfileSidePanel />
    </div>
  )
}
