'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeedItem, FEED_ITEMS } from '@/lib/feed'
import type { Takeaway, UserVerse } from '@/lib/mvp'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

type Tab = 'words' | 'glossary' | 'song'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'words',    label: '📚 Palavras' },
  { id: 'glossary', label: '✍️ Glossário' },
  { id: 'song',     label: '🎼 Minha música' },
]

function songTitleByVideoId(videoId: string | null): string | null {
  if (!videoId) return null
  const item = FEED_ITEMS.find((i) => i.youtube_id === videoId)
  return item?.title ?? null
}

// Biblioteca: tudo que o usuário construiu — palavras salvas, glossário
// (takeaways escritos) e a música pessoal formada pelos versos.
export default function LibraryPage() {
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
    ]).then(([c, t]) => {
      setCards(c)
      setTakeaways(t.takeaways)
      setVerses(t.verses)
      setLoaded(true)
    })
  }, [])

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Biblioteca</h1>
        <p className="app-hero-subtitle">
          O inglês que você já fez seu: palavras, aprendizados e a sua música.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: `1.5px solid ${tab === t.id ? 'var(--moss)' : 'var(--line)'}`,
              background: tab === t.id ? 'var(--moss)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <>
          {loaded && cards.length === 0 && (
            <EmptyState
              title="Nenhuma palavra salva ainda."
              body="Abra uma música e toque nas palavras que quiser aprender."
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
            <span className="mini-label">Como funciona</span>
            <p className="panel-copy">
              Nada entra aqui automaticamente. O glossário são os aprendizados
              que <strong>você escreveu</strong> ao fim de cada ciclo de revisão.
            </p>
          </div>
          {loaded && takeaways.length === 0 && (
            <EmptyState
              title="Glossário vazio."
              body="Complete o Day 3 de uma música e escreva o que mais te marcou."
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {takeaways.map((t) => {
              const item = getFeedItem(t.song_id)
              return (
                <div key={t.id} className="panel" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55 }}>{t.text}</p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, marginTop: 6 }}>
                      {item ? `♪ ${item.title} · ` : ''}{new Date(t.created_at).toLocaleDateString('pt-BR')}
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
            <span className="mini-label">🎼 Sua música</span>
            <p className="panel-copy">
              A cada dois aprendizados do glossário, um verso novo nasce.
              Verso a verso, você compõe a música da sua própria jornada.
            </p>
          </div>
          {loaded && verses.length === 0 && (
            <EmptyState
              title="Sua música ainda não começou."
              body="Escreva dois aprendizados no glossário e o primeiro verso aparece aqui."
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
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
        {title}
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>{body}</p>
      <Link href="/feed" className="btn-primary" style={{ textDecoration: 'none' }}>Ir para as músicas</Link>
    </div>
  )
}
