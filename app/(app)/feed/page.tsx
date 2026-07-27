'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import FeedItemCard from '@/components/FeedItemCard'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'
import { TargetIcon, BookIcon, MusicNoteIcon, LevelIcon } from '@/components/ui/Icons'
import { STUDY_LEVELS, songsForLevel, nextReviewStep, type SongProgress, type StudyLevel } from '@/lib/mvp'
import { useLang, type DictKey } from '@/lib/i18n'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVEL_ORDER: StudyLevel[] = ['beginner', 'intermediate', 'advanced']

function progressBadge(
  p: SongProgress | undefined,
  t: (k: DictKey) => string,
): { label: string; color: string } | null {
  if (!p) return null
  const step = nextReviewStep(p)
  if (step === 'done') return { label: t('home.done'), color: 'var(--moss)' }
  return { label: `${t('home.reviewDay')} ${step.day}`, color: 'var(--clay)' }
}

export default function FeedPage() {
  const { t } = useLang()
  const [studyLevel, setStudyLevel] = useState<StudyLevel | null>(null)
  const [progress, setProgress] = useState<SongProgress[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<{ progress: SongProgress[]; study_level: StudyLevel | null }>('/api/progress')
      .then((d) => {
        setProgress(d.progress)
        setStudyLevel(d.study_level)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const byId = new Map(progress.map((p) => [p.song_id, p]))
  const isDone = (id: string) => {
    const p = byId.get(id)
    return !!p && nextReviewStep(p) === 'done'
  }

  // Nível do usuário primeiro; demais em seguida (poucas músicas, zero filtro).
  const ordered = studyLevel
    ? [studyLevel, ...LEVEL_ORDER.filter((l) => l !== studyLevel)]
    : LEVEL_ORDER

  // "Sua música da semana": a primeira do seu nível ainda não concluída.
  const mySongs = studyLevel ? songsForLevel(studyLevel) : []
  const weekly = mySongs.find((s) => {
    const p = byId.get(s.id)
    return !p || nextReviewStep(p) !== 'done'
  })

  const myLevelDone = mySongs.filter((s) => isDone(s.id)).length
  const totalSongs = LEVEL_ORDER.reduce((sum, l) => sum + songsForLevel(l).length, 0)
  const totalDone = LEVEL_ORDER.reduce((sum, l) => sum + songsForLevel(l).filter((s) => isDone(s.id)).length, 0)

  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <h1 className="app-hero-title">{t('home.title')}</h1>
          <p className="app-hero-subtitle">{t('home.subtitle')}</p>
        </div>

        <div className="stat-pill-row">
          <Link href="/level" className="stat-pill">
            <span className="stat-pill-icon clay"><TargetIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{studyLevel ? STUDY_LEVELS[studyLevel].label : 'Not set'}</span>
              <span className="stat-pill-label">Your level</span>
            </span>
          </Link>
          <div className="stat-pill">
            <span className="stat-pill-icon butter"><BookIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{myLevelDone}/{mySongs.length} Songs</span>
              <span className="stat-pill-label">Completed at your level</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}><MusicNoteIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{totalDone}/{totalSongs} Total</span>
              <span className="stat-pill-label">Across all levels</span>
            </span>
          </div>
        </div>

        {loaded && !studyLevel && (
          <div className="alert-info" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>{t('home.pickLevel')}</span>
            <Link href="/level" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px' }}>
              {t('home.pickLevelCta')}
            </Link>
          </div>
        )}

        {weekly && (
          <>
            <div className="section-title">{t('home.weekly')}</div>
            <div style={{ maxWidth: 420, marginBottom: 32 }}>
              <FeedItemCard item={weekly} />
            </div>
          </>
        )}

        {ordered.map((level) => {
          const songs = songsForLevel(level)
          if (songs.length === 0) return null
          const info = STUDY_LEVELS[level]
          return (
            <div key={level}>
              <div className="section-title">
                <LevelIcon level={level} size={14} /> {info.label}
                {studyLevel === level && (
                  <span style={{ marginLeft: 8, fontSize: '0.66rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}>
                    {t('home.yourLevel')}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {songs.map((item) => {
                  const badge = progressBadge(byId.get(item.id), t)
                  return (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <FeedItemCard item={item} />
                      {badge && (
                        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: '#fff', color: badge.color, border: `1.5px solid ${badge.color}`, pointerEvents: 'none' }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <ProfileSidePanel />
    </div>
  )
}
