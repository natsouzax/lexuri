'use client'

import { useEffect, useState } from 'react'
import BadgesGallery, { BADGES, deriveUnlockedIds } from '@/components/ui/BadgesGallery'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'
import { CardsIcon, FlameIcon, TrophyIcon } from '@/components/ui/Icons'

interface StatsSnippet {
  streak: number
  total_reviews: number
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<StatsSnippet | null>(null)

  useEffect(() => {
    apiFetch<StatsSnippet>('/api/gamification/stats')
      .then(setStats)
      .catch(() => null)
  }, [])

  const streak = stats?.streak ?? 0
  const totalReviews = stats?.total_reviews ?? 0
  const unlocked = deriveUnlockedIds([], totalReviews, streak)
  const unlockedCount = BADGES.filter((b) => unlocked.has(b.id)).length

  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <p className="app-hero-subtitle">Milestones on your learning journey</p>
          <h1 className="app-hero-title">Achievements</h1>
          <p className="app-hero-body">
            Each badge marks a concrete habit or milestone. Keep reviewing, saving and exploring to unlock them.
          </p>
        </div>

        <div className="stat-pill-row">
          <div className="stat-pill">
            <span className="stat-pill-icon clay"><TrophyIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{unlockedCount}/{BADGES.length} badges</span>
              <span className="stat-pill-label">Unlocked so far</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon butter"><FlameIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{streak} {streak === 1 ? 'day' : 'days'}</span>
              <span className="stat-pill-label">Current streak</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}><CardsIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{totalReviews.toLocaleString()} reviews</span>
              <span className="stat-pill-label">Cards reviewed</span>
            </span>
          </div>
        </div>

        <BadgesGallery unlockedIds={[]} totalReviews={totalReviews} streak={streak} />
      </div>

      <ProfileSidePanel />
    </div>
  )
}
