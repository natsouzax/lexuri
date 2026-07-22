'use client'

import Link from 'next/link'
import { ALBUMS, sungTracks } from '@/lib/album'

// Vitrine de álbuns conceituais (poucos, curados).
export default function AlbumsPage() {
  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Albums</h1>
        <p className="app-hero-subtitle">
          Go through a whole concept album — one that tells a story and makes you think.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {ALBUMS.map((album) => {
          const count = sungTracks(album).length
          return (
            <Link
              key={album.id}
              href={`/albums/${album.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
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
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 8px' }}>
                    {album.theme}
                  </p>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--moss)' }}>
                    {count} tracks · album cycle
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {ALBUMS.length === 0 && (
        <div className="alert-info">No albums yet — coming soon.</div>
      )}
    </>
  )
}
