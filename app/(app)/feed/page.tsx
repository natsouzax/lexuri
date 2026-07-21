'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import FeedItemCard from '@/components/FeedItemCard'
import { STUDY_LEVELS, songsForLevel, nextReviewStep, type SongProgress, type StudyLevel } from '@/lib/mvp'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVEL_ORDER: StudyLevel[] = ['beginner', 'intermediate', 'advanced']

function progressBadge(p: SongProgress | undefined): { label: string; color: string } | null {
  if (!p) return null
  const step = nextReviewStep(p)
  if (step === 'done') return { label: 'Concluída ✓', color: 'var(--moss)' }
  return { label: `Revisão: Day ${step.day}`, color: 'var(--clay)' }
}

export default function FeedPage() {
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

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Suas músicas</h1>
        <p className="app-hero-subtitle">
          Escolha uma música, ouça com a letra, toque no que não entender.
        </p>
      </div>

      {loaded && !studyLevel && (
        <div className="alert-info" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>Diga seu nível de inglês pra gente te indicar a música certa.</span>
          <Link href="/level" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px' }}>
            Escolher nível
          </Link>
        </div>
      )}

      {weekly && (
        <>
          <div className="section-title">🎧 Sua música da semana</div>
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
              {info.icon} {info.label}
              {studyLevel === level && (
                <span style={{ marginLeft: 8, fontSize: '0.66rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}>
                  seu nível
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
                const badge = progressBadge(byId.get(item.id))
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
    </>
  )
}
