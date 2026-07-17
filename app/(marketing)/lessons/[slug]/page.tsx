import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FEED_ITEMS, getThumbnail, getLevelColor } from '@/lib/feed'

interface Props {
  params: Promise<{ slug: string }>
}

const FEATURED = FEED_ITEMS.filter((item) => item.featured && !item.maintenance)

export function generateStaticParams() {
  return FEATURED.map((item) => ({ slug: item.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = FEATURED.find((i) => i.id === slug)
  if (!item) return {}

  const by = item.artist ?? item.channel ?? ''
  const title = `${item.title}${by ? ` — ${by}` : ''} | Learn English with Lexuri`
  const description = item.preview

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: getThumbnail(item.youtube_id), width: 320, height: 180 }],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const CHUNK_TYPES = [
  { label: 'Phrasal verbs', color: '#4CAF50' },
  { label: 'Idioms', color: '#FF6B6B' },
  { label: 'Collocations', color: '#4A90E2' },
  { label: 'Lexical chunks', color: '#9C27B0' },
  { label: 'Formulaic phrases', color: '#FF9800' },
  { label: 'Grammar patterns', color: '#00BCD4' },
]

export default async function PublicLessonPage({ params }: Props) {
  const { slug } = await params
  const item = FEATURED.find((i) => i.id === slug)
  if (!item) notFound()

  const levelColor = getLevelColor(item.level)
  const by = item.artist ?? item.channel ?? ''

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Lexuri</Link>
        {' › '}
        <Link href="/lessons" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Lessons</Link>
        {' › '}
        <span>{item.title}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ background: levelColor, color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>
            {item.level}
          </span>
          <span style={{ background: 'rgba(90,20,180,0.1)', color: 'rgba(90,20,180,0.9)', fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.06em' }}>
            ★ FEATURED
          </span>
          {item.type === 'music' && (
            <span style={{ background: 'rgba(140,30,180,0.1)', color: 'rgba(140,30,180,0.9)', fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 999 }}>
              MUSIC
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '2rem', lineHeight: 1.2, margin: '0 0 6px' }}>
          {item.title}
        </h1>
        {by && (
          <div style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 600 }}>{by}</div>
        )}
      </div>

      {/* Video embed */}
      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', marginBottom: 28, background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${item.youtube_id}`}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      {/* Preview description */}
      <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 28 }}>
        {item.preview}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
        {item.tags.map((tag) => (
          <span key={tag} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* What you'll learn */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 28px', marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 16px' }}>
          What Lexuri detects in this lesson
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
          {CHUNK_TYPES.map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '16px 0 0', lineHeight: 1.55 }}>
          Every chunk is highlighted directly in the transcript with a native-language translation, a contextual explanation, and a flashcard suggestion. Open the lesson inside Lexuri to study it interactively.
        </p>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, rgba(90,20,180,0.06), rgba(200,111,74,0.08))', borderRadius: 20, border: '1px solid var(--line)' }}>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 8px' }}>
          Study this lesson for free
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.55 }}>
          Lexuri syncs the video with the transcript, highlights every chunk in your language, and turns them into flashcards for spaced repetition — all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '0.9rem' }}>
            Start for free
          </Link>
          <Link href={`/feed/${item.id}`} style={{ textDecoration: 'none', padding: '12px 28px', fontSize: '0.9rem', border: '1.5px solid var(--line)', borderRadius: 999, color: 'var(--ink)', fontWeight: 700 }}>
            Open lesson
          </Link>
        </div>
      </div>

      {/* Other featured lessons */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 16px' }}>
          More featured lessons
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {FEATURED.filter((i) => i.id !== item.id).slice(0, 6).map((other) => (
            <Link key={other.id} href={`/lessons/${other.id}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 12, color: 'inherit', transition: 'background 120ms ease' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getThumbnail(other.youtube_id)} alt={other.title} style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.3 }}>{other.title}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{other.artist ?? other.channel} · {other.level}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
