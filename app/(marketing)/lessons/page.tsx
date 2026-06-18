import type { Metadata } from 'next'
import Link from 'next/link'
import { FEED_ITEMS, getThumbnail, getLevelColor } from '@/lib/feed'

export const metadata: Metadata = {
  title: 'Featured Lessons — Learn English with Lexuri',
  description: 'Explore our hand-picked English lessons from music and YouTube videos. Each one is packed with phrasal verbs, idioms, and collocations detected by AI.',
}

const FEATURED = FEED_ITEMS.filter((item) => item.featured && !item.maintenance)

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1']

export default function LessonsIndexPage() {
  const byLevel = LEVEL_ORDER.map((level) => ({
    level,
    items: FEATURED.filter((item) => item.level === level),
  })).filter((g) => g.items.length > 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '2.4rem', lineHeight: 1.15, margin: '0 0 12px' }}>
          Featured Lessons
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
          Hand-picked music and videos with AI-detected phrasal verbs, idioms, collocations and grammar patterns — all highlighted directly in the transcript.
        </p>
        <Link href="/register" className="btn-mkt-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 28px' }}>
          Start learning for free →
        </Link>
      </div>

      {byLevel.map(({ level, items }) => (
        <div key={level} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ background: getLevelColor(level), color: '#fff', fontSize: '0.72rem', fontWeight: 900, padding: '3px 12px', borderRadius: 999, letterSpacing: '0.06em' }}>
              {level}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
              {level === 'A1' ? 'Beginner' : level === 'A2' ? 'Elementary' : level === 'B1' ? 'Intermediate' : level === 'B2' ? 'Upper-Intermediate' : 'Advanced'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/lessons/${item.id}`}
                className="lesson-card"
              >
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getThumbnail(item.youtube_id)}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {item.type === 'music' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(90,20,120,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>♪</span>
                    </div>
                  )}
                  <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>
                    {item.duration}
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {item.channel ?? item.artist}
                  </div>
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.preview}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
