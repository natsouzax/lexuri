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

// Status de aprendizado derivado do estado SM-2 (imersão: rótulos em inglês).
type WordStatus = 'new' | 'learning' | 'familiar' | 'mature'

function wordStatus(card: Flashcard): { key: WordStatus; label: string; color: string } {
  if (card.repetitions === 0) return { key: 'new',      label: 'New',      color: '#4A90E2' }
  if (card.interval < 7)      return { key: 'learning', label: 'Learning', color: '#f59e0b' }
  if (card.interval < 21)     return { key: 'familiar', label: 'Familiar', color: '#9C27B0' }
  return                             { key: 'mature',   label: 'Mature',   color: 'var(--moss)' }
}

type SortKey = 'recent' | 'az' | 'status'

// Biblioteca: tudo que o usuário construiu — palavras salvas, glossário
// (takeaways escritos) e a música pessoal formada pelos versos.
export default function LibraryPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('words')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [takeaways, setTakeaways] = useState<Takeaway[]>([])
  const [verses, setVerses] = useState<UserVerse[]>([])
  const [loaded, setLoaded] = useState(false)

  // Filtros da aba de palavras.
  const [search, setSearch] = useState('')
  const [songFilter, setSongFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('recent')

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

          {cards.length > 0 && (() => {
            // Músicas presentes na biblioteca, pro dropdown de filtro.
            const songs = Array.from(
              new Set(cards.map((c) => c.source_video).filter((v): v is string => !!v)),
            ).map((v) => ({ id: v, title: songTitleByVideoId(v) ?? v }))

            const filtered = cards
              .filter((c) => {
                if (search && !`${c.word} ${c.translation}`.toLowerCase().includes(search.toLowerCase())) return false
                if (songFilter !== 'all' && c.source_video !== songFilter) return false
                if (statusFilter !== 'all' && wordStatus(c).key !== statusFilter) return false
                return true
              })
              .sort((a, b) => {
                if (sortBy === 'az') return a.word.localeCompare(b.word)
                if (sortBy === 'status') return a.interval - b.interval
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              })

            const STATUS: Array<{ k: WordStatus | 'all'; label: string }> = [
              { k: 'all', label: 'All' },
              { k: 'new', label: 'New' },
              { k: 'learning', label: 'Learning' },
              { k: 'familiar', label: 'Familiar' },
              { k: 'mature', label: 'Mature' },
            ]

            return (
              <>
                {/* Filtros — sempre em inglês (imersão) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 18 }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search words…"
                    style={{ flex: '1 1 180px', minWidth: 160, padding: '8px 14px', borderRadius: 999, border: '1.5px solid var(--line)', background: '#fff', fontSize: '0.85rem' }}
                  />
                  {songs.length > 0 && (
                    <select
                      value={songFilter}
                      onChange={(e) => setSongFilter(e.target.value)}
                      style={{ padding: '8px 14px', borderRadius: 999, border: '1.5px solid var(--line)', background: '#fff', fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      <option value="all">All songs</option>
                      {songs.map((s) => <option key={s.id} value={s.id}>♪ {s.title}</option>)}
                    </select>
                  )}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    style={{ padding: '8px 14px', borderRadius: 999, border: '1.5px solid var(--line)', background: '#fff', fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    <option value="recent">Newest first</option>
                    <option value="az">A → Z</option>
                    <option value="status">Least learned</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {STATUS.map(({ k, label }) => {
                    const active = statusFilter === k
                    return (
                      <button
                        key={k}
                        onClick={() => setStatusFilter(k)}
                        style={{
                          padding: '4px 14px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${active ? 'var(--moss)' : 'var(--line)'}`,
                          background: active ? 'var(--moss)' : 'transparent',
                          color: active ? '#fff' : 'var(--muted)',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', alignSelf: 'center' }}>
                    {filtered.length} / {cards.length}
                  </span>
                </div>

                {filtered.length === 0 ? (
                  <div className="alert-info">No words match these filters.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {filtered.map((card) => {
                      const song = songTitleByVideoId(card.source_video)
                      const st = wordStatus(card)
                      return (
                        <div key={card.id} className="panel">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.05rem' }}>
                              {card.word}
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: `${st.color}22`, color: st.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {st.label}
                            </span>
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
                )}
              </>
            )
          })()}
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
