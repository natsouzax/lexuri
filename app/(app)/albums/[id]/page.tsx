'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAlbum, sungTracks, albumCycleUnlocked, nextAlbumStep, type AlbumProgress } from '@/lib/album'
import { getFeedItem } from '@/lib/feed'
import { nextReviewStep, type SongProgress } from '@/lib/mvp'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

function trackBadge(p: SongProgress | undefined): { label: string; color: string } {
  if (!p) return { label: 'Not started', color: 'var(--muted)' }
  const step = nextReviewStep(p)
  if (step === 'done') return { label: 'Done ✓', color: 'var(--moss)' }
  return { label: `Review: Day ${step.day}`, color: 'var(--clay)' }
}

export default function AlbumPage() {
  const params = useParams<{ id: string }>()
  const album = getAlbum(params.id)

  const [songProgress, setSongProgress] = useState<SongProgress[]>([])
  const [doneSongIds, setDoneSongIds] = useState<Set<string>>(new Set())
  const [albumProgress, setAlbumProgress] = useState<AlbumProgress | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!album) return
    try {
      const d = await apiFetch<{ songProgress: SongProgress[]; doneSongIds: string[]; albumProgress: AlbumProgress | null }>(
        `/api/albums/${album.id}/progress`,
      )
      setSongProgress(d.songProgress)
      setDoneSongIds(new Set(d.doneSongIds))
      setAlbumProgress(d.albumProgress)
    } catch {}
    finally { setLoaded(true) }
  }, [album])

  useEffect(() => { load() }, [load])

  if (!album) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">Album not found.</div>
        <Link href="/albums" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Albums</Link>
      </div>
    )
  }

  const byId = new Map(songProgress.map((p) => [p.song_id, p]))
  const sung = sungTracks(album)
  const cycleUnlocked = albumCycleUnlocked(album, doneSongIds)
  const albumStep = nextAlbumStep(albumProgress)
  const doneCount = sung.filter((t) => doneSongIds.has(t.songId)).length

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/albums" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>← Albums</Link>
      </div>

      {/* Capa + tema */}
      <div
        style={{
          borderRadius: 20,
          background: `linear-gradient(135deg, ${album.cover[0]}, ${album.cover[1]})`,
          color: '#fff',
          padding: '28px 26px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', opacity: 0.85 }}>
          {album.artist.toUpperCase()} · {album.year}
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', margin: '6px 0 10px' }}>
          {album.title}
        </h1>
        <p style={{ fontSize: '0.92rem', lineHeight: 1.55, opacity: 0.92, margin: 0, maxWidth: 520 }}>{album.theme}</p>
        <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', maxWidth: 320 }}>
          <div style={{ width: `${(doneCount / Math.max(sung.length, 1)) * 100}%`, height: '100%', background: '#fff', borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: '0.76rem', fontWeight: 700, marginTop: 6, opacity: 0.9 }}>
          {doneCount} / {sung.length} tracks completed
        </div>
      </div>

      {/* Tracklist */}
      <div className="section-title">Tracklist</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {album.tracks.map((track, i) => {
          const item = getFeedItem(track.songId)
          const curated = !!item && !track.instrumental
          const badge = trackBadge(byId.get(track.songId))
          return (
            <div key={track.songId || track.title} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: track.instrumental ? 0.6 : 1 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)', width: 20, textAlign: 'center' }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{track.title}</div>
                {track.instrumental && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>🎹 instrumental interlude</div>}
                {!track.instrumental && !curated && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Coming soon</div>}
              </div>
              {curated ? (
                <>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: badge.color, whiteSpace: 'nowrap' }}>{badge.label}</span>
                  <Link href={`/feed/${track.songId}`} className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap' }}>
                    Study
                  </Link>
                </>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Ciclo global do álbum */}
      <div className="section-title">Album cycle</div>
      <div className="panel" style={{ textAlign: 'center' }}>
        {!cycleUnlocked ? (
          <>
            <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🔒</p>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>
              Finish every track first
            </p>
            <p className="panel-copy">
              Complete the 3-day cycle of all {sung.length} tracks to unlock the album-wide review and compose your own album track.
            </p>
          </>
        ) : albumStep === 'done' ? (
          <>
            <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>🏆</p>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 6 }}>
              Album complete!
            </p>
            <p className="panel-copy" style={{ marginBottom: 16 }}>You finished the whole album. Listen to the track you composed.</p>
            <Link href={`/albums/${album.id}/song`} className="btn-primary" style={{ textDecoration: 'none' }}>
              🎼 Your album track →
            </Link>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>
              Album Cycle — Day {albumStep.day}
            </p>
            <p className="panel-copy" style={{ marginBottom: 16 }}>
              A review across the whole album, then a final reflection on its theme.
            </p>
            {albumStep.available ? (
              <Link href={`/albums/${album.id}/cycle`} className="btn-primary" style={{ textDecoration: 'none' }}>
                Do Day {albumStep.day} now →
              </Link>
            ) : (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>Available tomorrow 🌙</span>
            )}
          </>
        )}
      </div>

      {loaded && sung.every((t) => !getFeedItem(t.songId)) && (
        <div className="alert-info" style={{ marginTop: 20 }}>
          Tracks not curated yet — run <code>generate-album-tracks</code> to populate them.
        </div>
      )}
    </>
  )
}
