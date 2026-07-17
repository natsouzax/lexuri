'use client'

import SpotifyPitch from './spotify/SpotifyPitch'

interface SpotifyConnectModalProps {
  returnTo?: string
  onClose: () => void
}

export default function SpotifyConnectModal({ returnTo = '/music', onClose }: SpotifyConnectModalProps) {
  function handleConnect() {
    window.location.href = `/api/spotify/auth?return_to=${encodeURIComponent(returnTo)}`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '36px 32px 28px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            background: 'none',
            border: 'none',
            fontSize: '1.3rem',
            cursor: 'pointer',
            color: 'var(--muted)',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <SpotifyPitch onConnect={handleConnect} />

        <button
          onClick={onClose}
          style={{
            marginTop: 10,
            width: '100%',
            background: 'transparent',
            border: '1.5px solid var(--line)',
            borderRadius: 999,
            padding: '10px 24px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          Not now, continue without
        </button>
      </div>
    </div>
  )
}
