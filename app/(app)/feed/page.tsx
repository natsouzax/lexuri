'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import FeedItemCard from '@/components/FeedItemCard'
import { FEED_ITEMS } from '@/lib/feed'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'] as const
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
    }).catch(() => {/* silent */})
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

  const filtered = FEED_ITEMS.filter(
    (item) => levelFilter === 'All' || item.level === levelFilter,
  )

  return (
    <>
      <Hero
        title="Learning Feed"
        subtitle="Discover → Save → Study."
        body="Browse curated videos, load transcripts, extract natural language chunks, and turn them into flashcards you'll actually remember."
      />

      {/* Metrics */}
      <div className="metrics-row">
        <MetricCard label="Curated items" value={FEED_ITEMS.length} />
        <MetricCard label="Saved cards" value={cardCount} />
        <MetricCard label="Due today" value={dueCount} />
      </div>

      {/* Filter by level */}
      <div className="section-title">Browse Content</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)' }}>Level:</span>
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
              transition: 'all 120ms ease',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Feed grid */}
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
        <div className="alert-info">No items for that level filter yet.</div>
      )}

      {/* Saved section */}
      {savedIds.length > 0 && (
        <>
          <div className="section-title">Saved for Later</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
              marginBottom: 32,
            }}
          >
            {FEED_ITEMS.filter((item) => savedIds.includes(item.id)).map((item) => (
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
