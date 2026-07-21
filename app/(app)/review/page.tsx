'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeedItem } from '@/lib/feed'
import { DAY_INFO, nextReviewStep, type SongProgress } from '@/lib/mvp'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Visão geral do ciclo de revisão: pra cada música ouvida, mostra qual
// Day está pendente (ou se o ciclo terminou).
export default function ReviewPage() {
  const [progress, setProgress] = useState<SongProgress[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiFetch<{ progress: SongProgress[] }>('/api/progress')
      .then((d) => setProgress(d.progress))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const rows = progress
    .map((p) => ({ p, item: getFeedItem(p.song_id), step: nextReviewStep(p) }))
    .filter((r) => r.item)

  const pending = rows.filter((r) => r.step !== 'done')
  const completed = rows.filter((r) => r.step === 'done')

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Revisão</h1>
        <p className="app-hero-subtitle">
          Três encontros curtos com cada música: leitura, memória e letra.
        </p>
      </div>

      {loaded && rows.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
            Nenhuma revisão ainda.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>
            Ouça uma música e salve algumas palavras — a primeira revisão começa na hora.
          </p>
          <Link href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>Escolher uma música</Link>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="section-title">Pendentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {pending.map(({ p, item, step }) => {
              if (step === 'done' || !item) return null
              const info = DAY_INFO[step.day]
              return (
                <div key={p.song_id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.6rem' }}>{info.icon}</span>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{info.title} — {info.desc}</div>
                  </div>
                  {step.available ? (
                    <Link href={`/review/${p.song_id}`} className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Fazer agora →
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      Disponível amanhã 🌙
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <div className="section-title">Ciclos completos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.map(({ p, item }) => item && (
              <div key={p.song_id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.8 }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 800 }}>{item.title}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>{item.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
