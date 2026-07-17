'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import FeedItemCard from '@/components/FeedItemCard'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import { contentTabs } from '@/lib/product'
import { FEED_ITEMS } from '@/lib/feed'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Protótipo de validação: só as lições pré-prontas (transcript + chunks já
// gerados, sem custo de scraping ao vivo) — o mesmo conjunto que tem
// STATIC_LESSONS em data/featured-lessons/.
const ALL_ITEMS = FEED_ITEMS.filter((item) => item.featured === true)

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'] as const
type LevelFilter = (typeof LEVELS)[number]

export default function FeedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All')
  const [cardCount, setCardCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    setSavedIds(getSavedItemIds())
  }, [])

  useEffect(() => {
    apiFetch<Flashcard[]>('/api/flashcards').then(async (cards) => {
      setCardCount(cards.length)
      const { getDueCards } = await import('@/lib/srs')
      setDueCount(getDueCards(cards).length)
    }).catch(() => {})
  }, [])

  function handleToggleSave(id: string) {
    if (savedIds.includes(id)) {
      unsaveItem(id)
      setSavedIds((prev) => prev.filter((s) => s !== id))
    } else {
      saveItem(id)
      setSavedIds((prev) => [...prev, id])
    }
  }

  const filtered = ALL_ITEMS.filter(
    (item) => levelFilter === 'All' || item.level === levelFilter,
  )

  return (
    <>
      <Hero
        title="Learn"
        subtitle="Discover content, then turn it into memory."
        body="Pick a lesson, read the synced transcript, tap the chunks worth remembering, and let AI turn them into flashcards ready for review."
      />

      <div className="learn-tabs">
        {contentTabs.map((tab) => (
          <a key={tab.href} href={tab.href} className={`learn-tab${tab.href === '/feed' ? ' active' : ''}`}>
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </a>
        ))}
      </div>

      <div className="metrics-row">
        <MetricCard label="Curated lessons" value={ALL_ITEMS.length} />
        <MetricCard label="Saved flashcards" value={cardCount} />
        <MetricCard label="Reviews due" value={dueCount} />
      </div>

      <div className="section-title">Featured Lessons</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Level:</span>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              style={{
                padding: '5px 14px',
                borderRadius: 999,
                border: `1.5px solid ${levelFilter === l ? 'var(--clay)' : 'var(--line)'}`,
                background: levelFilter === l ? 'var(--clay)' : 'transparent',
                color: levelFilter === l ? '#fff' : 'var(--muted)',
                fontWeight: levelFilter === l ? 700 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {filtered.map((item) => (
          <FeedItemCard
            key={item.id}
            item={item}
            saved={savedIds.includes(item.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="alert-info">No lessons match that level yet.</div>
      )}

      {savedIds.length > 0 && (
        <>
          <div className="section-title">Saved Lessons</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
              marginBottom: 32,
            }}
          >
            {ALL_ITEMS.filter((item) => savedIds.includes(item.id)).map((item) => (
              <FeedItemCard
                key={item.id}
                item={item}
                saved={true}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
