'use client'

interface UnverifiedModalProps {
  onAddAnyway: () => void
  onCancel: () => void
  context?: 'music' | 'video'
}

export default function UnverifiedModal({
  onAddAnyway,
  onCancel,
  context = 'music',
}: UnverifiedModalProps) {
  const noun = context === 'music' ? 'lyrics' : 'captions'

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
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
          padding: '32px 28px 24px',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>

        <p
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 900,
            fontSize: '1.15rem',
            marginBottom: 10,
          }}
        >
          {context === 'music' ? 'Unverified lyrics' : 'Captions not verified'}
        </p>

        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 22 }}>
          We couldn&apos;t find reliable {noun} for this{' '}
          {context === 'music' ? 'song' : 'video'}.{' '}
          The {noun} may be missing, inaccurate, or poorly formatted.
        </p>

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 24 }}>
          You can still add it — a warning will be displayed while studying.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onAddAnyway}
            style={{
              background: 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '11px 24px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Add anyway
          </button>
          <button
            onClick={onCancel}
            style={{
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
