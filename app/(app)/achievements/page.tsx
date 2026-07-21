'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import BadgesGallery from '@/components/ui/BadgesGallery'

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

  return (
    <>
      <Hero
        title="Achievements"
        subtitle="Milestones on your learning journey."
        body="Each badge marks a concrete habit or milestone. Keep reviewing, saving and exploring to unlock them."
      />
      <BadgesGallery
        unlockedIds={[]}
        totalReviews={stats?.total_reviews ?? 0}
        streak={stats?.streak ?? 0}
      />
    </>
  )
}
