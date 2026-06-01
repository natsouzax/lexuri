'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import FeedItemCard from '@/components/FeedItemCard'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import type { FeedItem } from '@/lib/feed'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'] as const
type LevelFilter = (typeof LEVELS)[number]
type TypeFilter = 'All' | 'video' | 'music'

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [cardCount, setCardCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    setSavedIds(getSavedItemIds())
  }, [])

  useEffect(() => {
    apiFetch<FeedItem[]>('/api/feed/items').then(setFeedItems).catch(() => {/* silent */})
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

  const filtered = feedItems.filter(
    (item) =>
      (levelFilter === 'All' || item.level === levelFilter) &&
      (typeFilter === 'All' || item.type === typeFilter),
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
        <MetricCard label="Curated items" value={feedItems.length} />
        <MetricCard label="Saved cards" value={cardCount} />
        <MetricCard label="Due today" value={dueCount} />
      </div>

      {/* Filters */}
      <div className="section-title">Browse Content</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {/* Type filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Type:</span>
          {(['All', 'video', 'music'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '5px 14px',
                borderRadius: 999,
                border: `1.5px solid ${typeFilter === t ? 'var(--ink)' : 'var(--line)'}`,
                background: typeFilter === t ? 'var(--ink)' : 'transparent',
                color: typeFilter === t ? '#fff' : 'var(--muted)',
                fontWeight: typeFilter === t ? 700 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {t === 'video' ? '▶ Video' : t === 'music' ? '♪ Music' : 'All'}
            </button>
          ))}
        </div>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                transition: 'all 120ms ease',
              }}
            >
              {l}
            </button>
          ))}
        </div>
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
            {feedItems.filter((item) => savedIds.includes(item.id)).map((item) => (
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
