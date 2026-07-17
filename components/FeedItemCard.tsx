import Link from 'next/link'
import type { FeedItem } from '@/lib/feed'
import { getThumbnail, getLevelColor } from '@/lib/feed'

interface Props {
  item: FeedItem
  saved: boolean
  onToggleSave: (id: string) => void
}

export default function FeedItemCard({ item, saved, onToggleSave }: Props) {
  const thumb = getThumbnail(item.youtube_id)
  const levelColor = getLevelColor(item.level)

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 20,
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 160ms ease, transform 160ms ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail */}
      <Link href={`/feed/${item.id}`} style={{ display: 'block', position: 'relative', aspectRatio: '16/9', background: item.type === 'music' ? '#1a1a2e' : '#f0ebe0', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Music overlay tint */}
        {item.type === 'music' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(90,20,120,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>♪</span>
          </div>
        )}
        {/* Duration badge */}
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
          }}
        >
          {item.duration}
        </span>
        {/* Featured banner */}
        {item.featured && !item.maintenance && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(90,20,180,0.88)', color: '#fff', fontSize: '0.64rem', fontWeight: 800, padding: '4px 8px', textAlign: 'center', letterSpacing: '0.06em' }}>
            ★ FEATURED LESSON
          </div>
        )}
        {/* Maintenance overlay strip */}
        {item.maintenance && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(217,119,6,0.92)', color: '#fff', fontSize: '0.64rem', fontWeight: 800, padding: '4px 8px', textAlign: 'center', letterSpacing: '0.05em' }}>
            ⚠ UNDER MAINTENANCE
          </div>
        )}
        {/* Level badge */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: levelColor,
            color: '#fff',
            fontSize: '0.66rem',
            fontWeight: 900,
            padding: '2px 8px',
            borderRadius: 999,
            letterSpacing: '0.06em',
          }}
        >
          {item.level}
        </span>
        {/* Type badge */}
        {item.type === 'music' && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(140,30,180,0.85)',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: 999,
              letterSpacing: '0.06em',
            }}
          >
            MUSIC
          </span>
        )}
        {item.type === 'video' && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(220,38,38,0.85)',
              color: '#fff',
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: 999,
              letterSpacing: '0.06em',
            }}
          >
            ▶ VIDEO
          </span>
        )}
      </Link>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {item.channel ?? item.artist}
        </div>
        <Link
          href={`/feed/${item.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', lineHeight: 1.25, marginBottom: 8 }}>
            {item.title}
          </div>
        </Link>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 12px', flex: 1 }}>
          {item.preview}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {item.tags.map((tag) => (
            <span
              key={tag}
              style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Maintenance warning */}
        {item.maintenance && (
          <div style={{ fontSize: '0.72rem', color: '#92400e', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.45)', borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontWeight: 600 }}>
            This lesson is under maintenance and may contain errors.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/feed/${item.id}`}
            className="btn-primary"
            style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.8rem', padding: '8px 12px' }}
          >
            Study
          </Link>
          <button
            onClick={() => onToggleSave(item.id)}
            style={{
              border: `1.5px solid ${saved ? 'var(--clay)' : 'var(--line)'}`,
              borderRadius: 999,
              padding: '8px 14px',
              background: saved ? 'rgba(200,111,74,0.1)' : '#fff',
              color: saved ? 'var(--clay)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 120ms ease',
            }}
            title={saved ? 'Remove from saved' : 'Save for later'}
          >
            {saved ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
