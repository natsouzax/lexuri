'use client'

import Link from 'next/link'
import { ALBUMS, sungTracks, type Album } from '@/lib/album'
import { STUDY_LEVELS, type StudyLevel } from '@/lib/mvp'

const LEVEL_ORDER: StudyLevel[] = ['beginner', 'intermediate', 'advanced']

function AlbumCard({ album }: { album: Album }) {
  const count = sungTracks(album).length
  const curated = count > 0
  return (
    <Link href={`/albums/${album.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            aspectRatio: '1/1',
            background: `linear-gradient(135deg, ${album.cover[0]}, ${album.cover[1]})`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 20,
            color: '#fff',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', opacity: 0.85 }}>
            {album.artist.toUpperCase()} · {album.year}
          </div>
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.6rem', lineHeight: 1.1 }}>
            {album.title}
          </div>
        </div>
        <div style={{ padding: '14px 16px', background: '#fff' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 8px' }}>{album.theme}</p>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: curated ? 'var(--moss)' : 'var(--muted)' }}>
            {curated ? `${count} tracks · album cycle` : 'Coming soon'}
          </span>
        </div>
      </div>
    </Link>
  )
}

// Vitrine de álbuns conceituais, agrupada por nível (básico/intermediário/
// avançado) — um álbum-jornada para cada nível do app.
export default function AlbumsPage() {
  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Albums</h1>
        <p className="app-hero-subtitle">
          Go through a whole concept album — one that tells a story and makes you think.
        </p>
      </div>

      {LEVEL_ORDER.map((level) => {
        const albums = ALBUMS.filter((a) => a.level === level)
        const info = STUDY_LEVELS[level]
        return (
          <div key={level}>
            <div className="section-title">{info.icon} {info.label}</div>
            {albums.length === 0 ? (
              <div className="alert-info" style={{ marginBottom: 28 }}>
                No {info.label.toLowerCase()} album yet — coming soon.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                {albums.map((album) => <AlbumCard key={album.id} album={album} />)}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
