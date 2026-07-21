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
        title="Conquistas"
        subtitle="Marcos da sua jornada de aprendizado."
        body="Cada badge representa um hábito ou marco concreto. Continue revisando, criando e explorando para desbloqueá-los."
      />
      <BadgesGallery
        unlockedIds={[]}
        totalReviews={stats?.total_reviews ?? 0}
        streak={stats?.streak ?? 0}
      />
    </>
  )
}
