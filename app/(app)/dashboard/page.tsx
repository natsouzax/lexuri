'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import { learningLoop, recommendedLessons } from '@/lib/product'
import type { Rank, XPProgressInfo, Mission } from '@/lib/gamification'
import type { Flashcard } from '@/lib/types'

interface MissionProgress extends Mission {
  progress: number
  completed: boolean
}

interface XPEvent {
  event_type: string
  points: number
  event_ts: string
}

interface StatsData {
  points: number
  streak: number
  total_reviews: number
  rank: Rank
  xpProgress: XPProgressInfo
  missionsToday: MissionProgress[]
  weekActivity: boolean[]
  xpHistory: XPEvent[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const EVENT_LABELS: Record<string, string> = {
  flashcard_review: 'Reviewed cards',
  chunk_analyzed: 'Analyzed a lesson',
  chunk_saved: 'Saved a chunk',
  video_studied: 'Studied a YouTube lesson',
  music_studied: 'Completed a Music Lab session',
  word_looked_up: 'Looked up a word',
  streak_bonus: 'Protected your streak',
  mission_complete: 'Completed a mission',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      const name: string = meta?.full_name ?? data.user?.email?.split('@')[0] ?? 'there'
      setUsername(name.split(' ')[0])
    })

    Promise.all([
      apiFetch<StatsData>('/api/gamification/stats').then(setStats).catch(() => null),
      apiFetch<Flashcard[]>('/api/flashcards')
        .then(async (cards) => {
          const { getDueCards } = await import('@/lib/srs')
          setDueCount(getDueCards(cards).length)
        })
        .catch(() => null),
    ]).finally(() => setLoading(false))
  }, [])

  const reviewGoal = 10
  const reviewedToday = stats?.missionsToday.find((m) => m.eventType === 'flashcard_review')?.progress ?? 0
  const goalPct = Math.min(100, Math.round((reviewedToday / reviewGoal) * 100))
  const rank = stats?.rank
  const xp = stats?.xpProgress
  const currentLesson = recommendedLessons[0]

  return (
    <>
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="app-hero-subtitle">{greeting()}, {username || 'there'}</p>
          <h1 className="app-hero-title">Continue learning from real English.</h1>
          <p className="app-hero-body">
            Watch, listen, save the useful chunks, then review them before they fade.
          </p>
          <div className="learning-loop">
            {learningLoop.map((step) => <span key={step}>{step}</span>)}
          </div>
        </div>
        <Link href={currentLesson.href} className="continue-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentLesson.thumbnail} alt="" />
          <div className="continue-card-body">
            <span className="mini-label">Continue learning</span>
            <h2>{currentLesson.title}</h2>
            <p>{currentLesson.chunks - 8} / {currentLesson.chunks} chunks learned</p>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${currentLesson.progress}%` }} />
            </div>
            <span className="btn-primary">Continue Learning</span>
          </div>
        </Link>
      </div>

      <div className="home-grid">
        <section className="panel">
          <div className="panel-head">
            <span className="mini-label">Daily goal</span>
            <strong>{reviewedToday} / {reviewGoal}</strong>
          </div>
          <div className="goal-circle" style={{ ['--goal' as string]: `${goalPct}%` }}>
            <span>{goalPct}%</span>
          </div>
          <p className="panel-copy">Review 10 cards to keep your memory curve healthy.</p>
          <WeeklyCalendar weekActivity={stats?.weekActivity ?? Array(7).fill(false)} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="mini-label">Current level</span>
            <strong>{rank?.label ?? 'Explorer'}</strong>
          </div>
          <p className="rank-title">{(stats?.points ?? 148).toLocaleString()} XP</p>
          <div className="xp-bar-track-light">
            <div className="xp-bar-fill" style={{ width: `${xp?.progressPct ?? 74}%` }} />
          </div>
          <p className="panel-copy">
            {xp?.nextRank ? `${xp.xpToNext?.toLocaleString()} XP until ${xp.nextRank.label}.` : 'You reached the top rank.'}
          </p>
        </section>

        <section className="panel review-panel">
          <div>
            <span className="mini-label">Today&apos;s review</span>
            <h2>{loading ? '...' : dueCount} cards due</h2>
            <p className="panel-copy">Your fastest path to retention is one focused review session.</p>
          </div>
          <Link href="/review" className="btn-primary">Start Review</Link>
        </section>
      </div>

      <div className="section-title">Recommended Content</div>
      <div className="recommendation-row">
        {recommendedLessons.map((lesson) => (
          <Link href={lesson.href} key={lesson.title} className="recommendation-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lesson.thumbnail} alt="" />
            <div>
              <span className="mini-label">{lesson.source} · {lesson.difficulty}</span>
              <h3>{lesson.title}</h3>
              <p>{lesson.chunks} chunks available</p>
              <div className="skill-row">
                {lesson.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-title">Recent Activity</div>
      <div className="activity-list">
        {(stats?.xpHistory.length ? stats.xpHistory : [
          { event_type: 'chunk_saved', points: 8, event_ts: new Date().toISOString() },
          { event_type: 'flashcard_review', points: 10, event_ts: new Date().toISOString() },
          { event_type: 'video_studied', points: 30, event_ts: new Date().toISOString() },
        ]).slice(0, 5).map((evt, i) => (
          <div key={`${evt.event_type}-${i}`} className="activity-row">
            <span>{EVENT_LABELS[evt.event_type] ?? evt.event_type}</span>
            <small>{timeAgo(evt.event_ts)}</small>
            <strong>+{evt.points} XP</strong>
          </div>
        ))}
      </div>
    </>
  )
}
