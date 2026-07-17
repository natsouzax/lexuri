'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

// Use local JSON directly — the DB doesn't carry the `featured` field
const ALL_ITEMS = FEED_ITEMS.filter((item) => !item.maintenance)

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'] as const
type LevelFilter = (typeof LEVELS)[number]
type TypeFilter = 'featured' | 'All' | 'video' | 'music'
type ReadinessFilter = 'all' | 'ready' | 'unlock'

export default function FeedPage() {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('All')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('featured')
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all')
  const [readyIds, setReadyIds] = useState<Set<string> | null>(null)
  const [cardCount, setCardCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    setSavedIds(getSavedItemIds())
  }, [])

  useEffect(() => {
    apiFetch<{ ready: string[] }>('/api/feed/status')
      .then((res) => setReadyIds(new Set(res.ready)))
      .catch(() => setReadyIds(new Set()))
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

  function isReady(id: string): boolean {
    return readyIds === null || readyIds.has(id)
  }

  const filtered = ALL_ITEMS.filter((item) => {
    if (readinessFilter === 'ready' && !isReady(item.id)) return false
    if (readinessFilter === 'unlock' && isReady(item.id)) return false
    if (typeFilter === 'featured') return item.featured === true
    return (
      (levelFilter === 'All' || item.level === levelFilter) &&
      (typeFilter === 'All' || item.type === typeFilter)
    )
  })

  return (
    <>
      <Hero
        title="Learn"
        subtitle="Discover content, then turn it into memory."
        body="Browse curated TED talks, podcasts, videos, and music. Open one lesson, collect useful chunks, generate cards, and send them straight to review."
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

      <div className="section-title">
        {typeFilter === 'featured' ? 'Featured Lessons' : 'Discover Content'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Source:</span>
          {(['featured', 'All', 'video', 'music'] as TypeFilter[]).map((t) => {
            const isFeatured = t === 'featured'
            const active = typeFilter === t
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 999,
                  border: `1.5px solid ${active ? (isFeatured ? 'rgba(90,20,180,0.7)' : 'var(--ink)') : 'var(--line)'}`,
                  background: active ? (isFeatured ? 'rgba(90,20,180,0.88)' : 'var(--ink)') : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                  fontWeight: active ? 700 : 400,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {t === 'featured' ? '★ Featured' : t === 'video' ? 'Video' : t === 'music' ? 'Music' : 'All'}
              </button>
            )
          })}
        </div>
        {typeFilter !== 'featured' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Difficulty:</span>
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
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Status:</span>
          {([
            { id: 'all', label: 'All' },
            { id: 'ready', label: '✓ Ready to study' },
            { id: 'unlock', label: '🎧 Watch to unlock' },
          ] as { id: ReadinessFilter; label: string }[]).map((r) => (
            <button
              key={r.id}
              onClick={() => setReadinessFilter(r.id)}
              style={{
                padding: '5px 14px',
                borderRadius: 999,
                border: `1.5px solid ${readinessFilter === r.id ? 'var(--moss)' : 'var(--line)'}`,
                background: readinessFilter === r.id ? 'var(--moss)' : 'transparent',
                color: readinessFilter === r.id ? '#fff' : 'var(--muted)',
                fontWeight: readinessFilter === r.id ? 700 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {r.label}
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
            ready={isReady(item.id)}
            item={item}
            saved={savedIds.includes(item.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="alert-info">No lessons match that filter yet.</div>
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
                ready={isReady(item.id)}
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
