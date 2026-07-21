'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeedItem, FEED_ITEMS } from '@/lib/feed'
import type { Takeaway, UserVerse } from '@/lib/mvp'
import type { Flashcard } from '@/lib/types'
import { useLang, type DictKey } from '@/lib/i18n'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

type Tab = 'words' | 'glossary' | 'song'

const TABS: Array<{ id: Tab; labelKey: DictKey }> = [
  { id: 'words',    labelKey: 'lib.tab.words' },
  { id: 'glossary', labelKey: 'lib.tab.glossary' },
  { id: 'song',     labelKey: 'lib.tab.song' },
]

function songTitleByVideoId(videoId: string | null): string | null {
  if (!videoId) return null
  const item = FEED_ITEMS.find((i) => i.youtube_id === videoId)
  return item?.title ?? null
}

// Biblioteca: tudo que o usuário construiu — palavras salvas, glossário
// (takeaways escritos) e a música pessoal formada pelos versos.
export default function LibraryPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('words')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [takeaways, setTakeaways] = useState<Takeaway[]>([])
  const [verses, setVerses] = useState<UserVerse[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<Flashcard[]>('/api/flashcards').catch(() => [] as Flashcard[]),
      apiFetch<{ takeaways: Takeaway[]; verses: UserVerse[] }>('/api/takeaways')
        .catch(() => ({ takeaways: [], verses: [] })),
    ]).then(([c, tw]) => {
      setCards(c)
      setTakeaways(tw.takeaways)
      setVerses(tw.verses)
      setLoaded(true)
    })
  }, [])

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">{t('lib.title')}</h1>
        <p className="app-hero-subtitle">{t('lib.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: `1.5px solid ${tab === tb.id ? 'var(--moss)' : 'var(--line)'}`,
              background: tab === tb.id ? 'var(--moss)' : 'transparent',
              color: tab === tb.id ? '#fff' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <>
          {loaded && cards.length === 0 && (
            <EmptyState
              title={t('lib.words.empty.title')}
              body={t('lib.words.empty.body')}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {cards.map((card) => {
              const song = songTitleByVideoId(card.source_video)
              return (
                <div key={card.id} className="panel">
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.05rem' }}>
                    {card.word}
                  </div>
                  <div style={{ color: 'var(--clay)', fontWeight: 700, fontSize: '0.9rem', margin: '4px 0 8px' }}>
                    {card.translation}
                  </div>
                  {card.example && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                      “{card.example}”
                    </p>
                  )}
                  {song && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--moss)', marginTop: 8 }}>
                      ♪ {song}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'glossary' && (
        <>
          <div className="panel" style={{ marginBottom: 16 }}>
            <span className="mini-label">{t('lib.glossary.how.label')}</span>
            <p className="panel-copy">{t('lib.glossary.how.body')}</p>
          </div>
          {loaded && takeaways.length === 0 && (
            <EmptyState
              title={t('lib.glossary.empty.title')}
              body={t('lib.glossary.empty.body')}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {takeaways.map((tk) => {
              const item = getFeedItem(tk.song_id)
              return (
                <div key={tk.id} className="panel" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>{tk.text}</p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, marginTop: 6 }}>
                      {item ? `♪ ${item.title} · ` : ''}{new Date(tk.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'song' && (
        <>
          <div className="panel" style={{ marginBottom: 16 }}>
            <span className="mini-label">{t('lib.song.label')}</span>
            <p className="panel-copy">{t('lib.song.how')}</p>
          </div>
          {loaded && verses.length === 0 && (
            <EmptyState
              title={t('lib.song.empty.title')}
              body={t('lib.song.empty.body')}
            />
          )}
          {verses.length > 0 && (
            <div className="panel" style={{ padding: '32px 28px', textAlign: 'center' }}>
              {verses.map((v, i) => (
                <p
                  key={v.id}
                  style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', lineHeight: 1.8, whiteSpace: 'pre-line', margin: i === 0 ? 0 : '20px 0 0' }}
                >
                  {v.verse_text}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  const { t } = useLang()
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
        {title}
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>{body}</p>
      <Link href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>{t('lib.goSongs')}</Link>
    </div>
  )
}
