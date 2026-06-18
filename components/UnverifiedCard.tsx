// Shown inline in the feed when captions/lyrics couldn't be verified.
export default function UnverifiedCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1.5px solid rgba(234,179,8,0.35)',
        background: 'rgba(234,179,8,0.07)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.15rem' }}>⚠</span>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#92400e' }}>
          Content not verified
        </span>
      </div>
      <p style={{ fontSize: '0.83rem', color: '#78350f', lineHeight: 1.55, margin: 0 }}>
        We couldn&apos;t find reliable captions or lyrics for this content.
        Subtitles may be missing, inaccurate, or out of sync. Connect your Spotify
        account to unlock Musixmatch-verified lyrics.
      </p>
    </div>
  )
}
