'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAlbum } from '@/lib/album'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// A "faixa do usuário": os versos que ela compôs ao longo do álbum,
// apresentados como a última faixa do "álbum dela".
export default function AlbumSongPage() {
  const params = useParams<{ id: string }>()
  const album = getAlbum(params.id)
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!album) return
    apiFetch<{ compiledText: string }>(`/api/albums/${album.id}/song`)
      .then((d) => setText(d.compiledText))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [album])

  if (!album) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">Album not found.</div>
        <Link href="/albums" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Albums</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href={`/albums/${album.id}`} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>← {album.title}</Link>
      </div>

      <div
        style={{
          borderRadius: 20,
          background: `linear-gradient(135deg, ${album.cover[0]}, ${album.cover[1]})`,
          color: '#fff',
          padding: '32px 28px',
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', opacity: 0.85 }}>YOUR ALBUM TRACK</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', margin: '6px 0' }}>
          {album.title} — reimagined by you
        </h1>
      </div>

      {loaded && !text && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
            Your track is still empty.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
            Each pair of learnings you write across the album becomes a verse. Finish the tracks and your song takes shape here.
          </p>
          <Link href={`/albums/${album.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>Back to album</Link>
        </div>
      )}

      {text && (
        <div className="panel" style={{ padding: '32px 28px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>
            {text}
          </p>
        </div>
      )}
    </>
  )
}
