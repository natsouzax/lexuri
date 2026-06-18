'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import FeedItemCard from '@/components/FeedItemCard'
import SpotifyConnectModal from '@/components/SpotifyConnectModal'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import { contentTabs } from '@/lib/product'
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
  const [showSpotifyModal, setShowSpotifyModal] = useState(false)

  useEffect(() => {
    setSavedIds(getSavedItemIds())
  }, [])

  useEffect(() => {
    apiFetch<FeedItem[]>('/api/feed/items').then(setFeedItems).catch(() => {})
  }, [])

  // Show Spotify modal once per session if not connected
  useEffect(() => {
    if (sessionStorage.getItem('spotify_modal_dismissed')) return
    fetch('/api/spotify/status')
      .then((r) => r.json())
      .then((d: { connected: boolean }) => {
        if (!d.connected) setShowSpotifyModal(true)
      })
      .catch(() => {})
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

  const filtered = feedItems.filter(
    (item) =>
      (levelFilter === 'All' || item.level === levelFilter) &&
      (typeFilter === 'All' || item.type === typeFilter),
  )

  return (
    <>
      {showSpotifyModal && (
        <SpotifyConnectModal
          returnTo="/feed"
          onClose={() => {
            setShowSpotifyModal(false)
            sessionStorage.setItem('spotify_modal_dismissed', '1')
          }}
        />
      )}

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
        <MetricCard label="Curated lessons" value={feedItems.length} />
        <MetricCard label="Saved flashcards" value={cardCount} />
        <MetricCard label="Reviews due" value={dueCount} />
      </div>

      <div className="section-title">Discover Content</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)' }}>Source:</span>
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
              }}
            >
              {t === 'video' ? 'Video' : t === 'music' ? 'Music' : 'All'}
            </button>
          ))}
        </div>
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
