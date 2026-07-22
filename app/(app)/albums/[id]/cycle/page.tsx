'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Day1Read from '@/components/review/Day1Read'
import Day2Memory from '@/components/review/Day2Memory'
import { getAlbum, sungTracks, nextAlbumStep, type AlbumProgress } from '@/lib/album'
import { getFeedItem } from '@/lib/feed'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Ciclo GLOBAL do álbum: revisão do vocabulário de TODAS as faixas + uma
// reflexão final sobre o tema. Day 1 leitura, Day 2 memória, Day 3 reflexão.
export default function AlbumCyclePage() {
  const params = useParams<{ id: string }>()
  const album = getAlbum(params.id)

  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [albumProgress, setAlbumProgress] = useState<AlbumProgress | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [reflection, setReflection] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!album) return
    try {
      const [allCards, prog] = await Promise.all([
        apiFetch<Flashcard[]>('/api/flashcards'),
        apiFetch<{ albumProgress: AlbumProgress | null }>(`/api/albums/${album.id}/progress`),
      ])
      // Cards de qualquer faixa do álbum (source_video = youtube_id da faixa).
      const albumVideoIds = new Set(
        sungTracks(album).map((t) => getFeedItem(t.songId)?.youtube_id).filter(Boolean) as string[],
      )
      const albumCards = allCards.filter((c) => c.source_video && albumVideoIds.has(c.source_video))
      setCards(albumCards.length > 0 ? albumCards : allCards)
      setAlbumProgress(prog.albumProgress)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoaded(true)
    }
  }, [album])

  useEffect(() => { load() }, [load])

  async function markDay(day: 1 | 2 | 3) {
    if (!album) return
    setFinishing(true)
    try {
      const updated = await apiFetch<AlbumProgress>(`/api/albums/${album.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `day${day}` }),
      })
      setAlbumProgress(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setFinishing(false)
    }
  }

  async function submitReflection() {
    if (!album || !reflection.trim()) { setError('Write your reflection first.'); return }
    setFinishing(true)
    setError('')
    try {
      // A reflexão do álbum entra como takeaway (glossário) da 1ª faixa.
      const firstSong = sungTracks(album)[0]?.songId
      await apiFetch('/api/takeaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: firstSong, texts: [reflection.trim()] }),
      })
      // Compila a faixa do usuário e fecha o ciclo do álbum.
      await apiFetch(`/api/albums/${album.id}/song`)
      await markDay(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setFinishing(false)
    }
  }

  if (!album) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">Album not found.</div>
        <Link href="/albums" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Albums</Link>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--muted)' }}>
        <span className="spinner" /><span>Preparing the album cycle…</span>
      </div>
    )
  }

  const step = nextAlbumStep(albumProgress)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href={`/albums/${album.id}`} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>← {album.title}</Link>
      </div>

      <div className="app-hero" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 className="app-hero-title">
          {step === 'done' ? 'Album complete 🏆' : `Album Cycle — Day ${step.day}`}
        </h1>
        <p className="app-hero-subtitle">{album.title} · {album.artist}</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {step === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <Link href={`/albums/${album.id}/song`} className="btn-primary" style={{ textDecoration: 'none' }}>🎼 Your album track →</Link>
        </div>
      )}

      {step !== 'done' && !step.available && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🌙</p>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>This step opens tomorrow.</p>
          <Link href={`/albums/${album.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>Back to album</Link>
        </div>
      )}

      {step !== 'done' && step.available && cards && (
        <>
          {step.day === 1 && <Day1Read cards={cards} onDone={() => markDay(1)} finishing={finishing} />}
          {step.day === 2 && <Day2Memory cards={cards} onDone={() => markDay(2)} finishing={finishing} />}
          {step.day === 3 && (
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="panel" style={{ marginBottom: 16 }}>
                <span className="mini-label">✍️ Final reflection</span>
                <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', margin: '8px 0 4px' }}>
                  {album.reflection}
                </p>
                <p className="panel-copy" style={{ marginBottom: 14 }}>
                  This becomes part of your glossary — and helps compose your own album track.
                </p>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                  placeholder="Write your reflection…"
                  style={{ width: '100%', resize: 'vertical', borderRadius: 12, border: '1.5px solid var(--line)', background: '#fff', padding: '12px 14px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="btn-primary" onClick={submitReflection} disabled={finishing} style={{ padding: '10px 28px' }}>
                  {finishing ? <><span className="spinner" /> Saving…</> : 'Finish the album ✓'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
