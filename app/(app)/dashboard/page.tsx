'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { createClient } from '@/lib/supabase-browser'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import FeedItemCard from '@/components/FeedItemCard'
import DueCardsHero from '@/components/ui/DueCardsHero'
import StreakWidget from '@/components/ui/StreakWidget'
import DailyMissions from '@/components/ui/DailyMissions'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import { playSelect, playTap } from '@/lib/sfx'
import { learningLoop } from '@/lib/product'
import { getThumbnail } from '@/lib/feed'
import type { FeedItem } from '@/lib/feed'
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })
  return (
    <motion.div
      ref={ref}
      className="section-title"
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [oldestAgo, setOldestAgo] = useState(0)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])

  const gridRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(gridRef, { once: true, margin: '-40px 0px' })
  const activityRef = useRef<HTMLDivElement>(null)
  const activityInView = useInView(activityRef, { once: true, margin: '-40px 0px' })

  useEffect(() => {
    setSavedIds(getSavedItemIds())
  }, [])

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
          const due = getDueCards(cards)
          setDueCount(due.length)
          if (due.length > 0) {
            const oldest = due.reduce((a, b) =>
              new Date(a.next_review) < new Date(b.next_review) ? a : b
            )
            const daysAgo = Math.floor((Date.now() - new Date(oldest.next_review).getTime()) / 86_400_000)
            setOldestAgo(Math.max(0, daysAgo))
          }
        })
        .catch(() => null),
      apiFetch<FeedItem[]>('/api/feed/items').then(setFeedItems).catch(() => null),
    ]).finally(() => setLoading(false))
  }, [])

  function handleToggleSave(id: string) {
    if (savedIds.includes(id)) {
      playTap()
      unsaveItem(id)
      setSavedIds((prev) => prev.filter((s) => s !== id))
    } else {
      playSelect()
      saveItem(id)
      setSavedIds((prev) => [...prev, id])
    }
  }

  const reviewGoal = 10
  const reviewedToday = stats?.missionsToday.find((m) => m.eventType === 'flashcard_review')?.progress ?? 0
  const goalPct = Math.min(100, Math.round((reviewedToday / reviewGoal) * 100))
  const rank = stats?.rank
  const xp = stats?.xpProgress
  const musicItems = feedItems.filter((i) => i.type === 'music')
  const currentLesson = musicItems[0] ?? feedItems[0]
  const displayItems = (musicItems.length > 0 ? musicItems : feedItems).slice(0, 6)

  const activities = (stats?.xpHistory.length ? stats.xpHistory : [
    { event_type: 'chunk_saved', points: 8, event_ts: new Date().toISOString() },
    { event_type: 'flashcard_review', points: 10, event_ts: new Date().toISOString() },
    { event_type: 'video_studied', points: 30, event_ts: new Date().toISOString() },
  ]).slice(0, 5)

  return (
    <>
      {/* ── Due cards hero ── */}
      <DueCardsHero dueCount={dueCount} oldestAgo={oldestAgo} loading={loading} />

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-hero-copy">
          <motion.p
            className="app-hero-subtitle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT }}
          >
            {greeting()}, {username || 'there'}
          </motion.p>
          <motion.h1
            className="app-hero-title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: EASE_OUT }}
          >
            Continue learning from real English.
          </motion.h1>
          <motion.p
            className="app-hero-body"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24, ease: EASE_OUT }}
          >
            Watch, listen, save the useful chunks, then review them before they fade.
          </motion.p>
          <motion.div
            className="learning-loop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            {learningLoop.map((step, i) => (
              <motion.span
                key={step}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.06, ease: EASE_OUT }}
              >
                {step}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {currentLesson && (
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: EASE_OUT }}
          >
            <motion.div
              whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.99 }}
            >
              <Link href={`/feed/${currentLesson.id}`} className="continue-card">
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getThumbnail(currentLesson.youtube_id)} alt={currentLesson.title} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.22)' }}>
                    <motion.div
                      style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                      whileHover={{ scale: 1.12 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <span style={{ fontSize: '1.1rem', marginLeft: 3 }}>▶</span>
                    </motion.div>
                  </div>
                </div>
                <div className="continue-card-body">
                  <span className="mini-label">Start learning</span>
                  <h2>{currentLesson.title}</h2>
                  <p>{currentLesson.channel ?? currentLesson.artist} · {currentLesson.duration}</p>
                  <div className="skill-row">
                    {currentLesson.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <span className="btn-primary">Start Lesson</span>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* ── Stat panels ── */}
      <div className="home-grid">
        <motion.section
          className="panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.28, ease: EASE_OUT } }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="panel-head">
            <span className="mini-label">Daily goal</span>
            <strong>{reviewedToday} / {reviewGoal}</strong>
          </div>
          <div className="goal-circle" style={{ ['--goal' as string]: `${goalPct}%` }}>
            <span>{goalPct}%</span>
          </div>
          <p className="panel-copy">Review 10 cards to keep your memory curve healthy.</p>
          <WeeklyCalendar weekActivity={stats?.weekActivity ?? Array(7).fill(false)} />
        </motion.section>

        <motion.section
          className="panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.37, ease: EASE_OUT } }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="panel-head">
            <span className="mini-label">Current level</span>
            <strong>{rank?.label ?? 'Explorer'}</strong>
          </div>
          <p className="rank-title">{(stats?.points ?? 148).toLocaleString()} XP</p>
          <div className="xp-bar-track-light">
            <motion.div
              className="xp-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xp?.progressPct ?? 74}%` }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <p className="panel-copy">
            {xp?.nextRank ? `${xp.xpToNext?.toLocaleString()} XP until ${xp.nextRank.label}.` : 'You reached the top rank.'}
          </p>
        </motion.section>

        <motion.section
          className="panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.46, ease: EASE_OUT } }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <span className="mini-label" style={{ display: 'block', marginBottom: 14 }}>Streak</span>
          <StreakWidget
            streak={stats?.streak ?? 0}
            hasFreezeAvailable={false}
            freezeUsedToday={false}
          />
        </motion.section>
      </div>

      {/* ── Daily Missions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.56, ease: EASE_OUT } }}
        style={{ marginBottom: 8 }}
      >
        <DailyMissions missions={stats?.missionsToday ?? []} loading={loading} />
      </motion.div>

      {/* ── Recommended Content ── */}
      <SectionTitle>Recommended Content</SectionTitle>
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {displayItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            animate={gridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.07, ease: EASE_OUT }}
          >
            <FeedItemCard
              item={item}
              saved={savedIds.includes(item.id)}
              onToggleSave={handleToggleSave}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <SectionTitle>Recent Activity</SectionTitle>
      <div ref={activityRef} className="activity-list">
        {activities.map((evt, i) => (
          <motion.div
            key={`${evt.event_type}-${i}`}
            className="activity-row"
            initial={{ opacity: 0, x: -12 }}
            animate={activityInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: i * 0.06, ease: EASE_OUT }}
          >
            <span>{EVENT_LABELS[evt.event_type] ?? evt.event_type}</span>
            <small>{timeAgo(evt.event_ts)}</small>
            <strong>+{evt.points} XP</strong>
          </motion.div>
        ))}
      </div>
    </>
  )
}
