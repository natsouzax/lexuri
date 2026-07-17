'use client'

import { EN_COPY } from '@/lib/onboarding-i18n'

interface SpotifyPitchProps {
  onConnect: () => void
  title?: string
  unlockIntro?: string
  benefits?: [string, string][]
  privacyNote?: string
}

export default function SpotifyPitch({
  onConnect,
  title = EN_COPY.spotifyTitle,
  unlockIntro = EN_COPY.spotifyUnlockIntro,
  benefits = EN_COPY.spotifyBenefits,
  privacyNote = EN_COPY.spotifyPrivacy,
}: SpotifyPitchProps) {
  return (
    <div>
      <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>🎵</div>

      <div
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontWeight: 900,
          fontSize: '1.25rem',
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
        {unlockIntro}
      </p>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {benefits.map(([benefitTitle, sub]) => (
          <li key={benefitTitle} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--moss)',
                background: 'rgba(70,98,74,0.12)',
                padding: '2px 8px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}
            >
              ✓ {benefitTitle}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', paddingTop: 2 }}>{sub}</span>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
        {privacyNote}
      </p>

      <button
        onClick={onConnect}
        style={{
          background: '#1DB954',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '12px 24px',
          fontWeight: 700,
          fontSize: '0.92rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        Connect Spotify
      </button>
    </div>
  )
}
