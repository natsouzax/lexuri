'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { createClient } from '@/lib/supabase-browser'
import FeedItemCard from '@/components/FeedItemCard'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'
import { StarIcon, FlameIcon } from '@/components/ui/Icons'
import { getSavedItemIds, saveItem, unsaveItem } from '@/lib/storage/local'
import { playSelect, playTap } from '@/lib/sfx'
import { learningLoop } from '@/lib/product'
import { FEED_ITEMS, getThumbnail } from '@/lib/feed'
import type { FeedItem } from '@/lib/feed'
import type { Rank, XPProgressInfo, Mission } from '@/lib/gamification'

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

const EVENT_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  flashcard_review: { label: 'Review',  bg: 'var(--sage)',                    color: 'var(--moss)' },
  chunk_analyzed:   { label: 'Lesson',  bg: 'rgba(200,111,74,0.14)',          color: 'var(--clay)' },
  chunk_saved:      { label: 'Lesson',  bg: 'rgba(200,111,74,0.14)',          color: 'var(--clay)' },
  video_studied:    { label: 'Study',   bg: 'rgba(190,220,235,0.55)',         color: '#2b6a83' },
  music_studied:    { label: 'Study',   bg: 'rgba(190,220,235,0.55)',         color: '#2b6a83' },
  word_looked_up:   { label: 'Vocab',   bg: 'rgba(246,202,95,0.32)',          color: '#8a6510' },
  streak_bonus:     { label: 'Streak',  bg: 'rgba(200,111,74,0.14)',          color: 'var(--clay)' },
  mission_complete: { label: 'Mission', bg: 'var(--sage)',                    color: 'var(--moss)' },
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
  const [username, setUsername] = useState('')
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])

  const cwRowRef = useRef<HTMLDivElement>(null)
  const gridInView = useInView(cwRowRef, { once: true, margin: '-40px 0px' })
  const activityRef = useRef<HTMLDivElement>(null)
  const activityInView = useInView(activityRef, { once: true, margin: '-40px 0px' })

  useEffect(() => {
    setSavedIds(getSavedItemIds())
    // Só as lições curadas/prontas (mesmo conjunto do /feed) — nunca
    // recomenda algo que ainda não tem transcript/chunks gerados.
    setFeedItems(FEED_ITEMS.filter((item) => item.featured === true))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      const name: string = meta?.full_name ?? data.user?.email?.split('@')[0] ?? 'there'
      setUsername(name.split(' ')[0])
    })

    apiFetch<StatsData>('/api/gamification/stats').then(setStats).catch(() => null)
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

  function scrollContinueWatching(dir: 1 | -1) {
    cwRowRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  const reviewGoal = 10
  const reviewedToday = stats?.missionsToday.find((m) => m.eventType === 'flashcard_review')?.progress ?? 0
  const goalPct = Math.min(100, Math.round((reviewedToday / reviewGoal) * 100))
  const rank = stats?.rank
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
      <div className="dash-layout">
        {/* ═══════════════════════ MAIN COLUMN ═══════════════════════ */}
        <div className="dash-main">
          {/* ── Promo banner ── */}
          <div className="home-hero promo-banner">
            <span className="promo-sparkle promo-sparkle-1">✦</span>
            <span className="promo-sparkle promo-sparkle-2">✦</span>
            <span className="promo-sparkle promo-sparkle-3">✦</span>
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
              {currentLesson && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: EASE_OUT }}
                >
                  <Link href={`/feed/${currentLesson.id}`} className="btn-mkt-primary promo-cta">
                    <span style={{ fontSize: '0.85rem', marginLeft: -2 }}>▶</span>
                    Join the lesson
                  </Link>
                </motion.div>
              )}
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

          {/* ── Stat pill row ── */}
          <div className="stat-pill-row">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: EASE_OUT }}>
              <Link href="/review" className="stat-pill">
                <span className="pill-ring" style={{ ['--goal' as string]: `${goalPct}%` }}>
                  <span>{goalPct}%</span>
                </span>
                <span className="stat-pill-text">
                  <span className="stat-pill-value">{reviewedToday}/{reviewGoal} Reviewed</span>
                  <span className="stat-pill-label">Today&apos;s goal</span>
                </span>
                <ChevronRightIcon />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.37, ease: EASE_OUT }}>
              <Link href="/level" className="stat-pill">
                <span className="stat-pill-icon clay"><StarIcon size={17} /></span>
                <span className="stat-pill-text">
                  <span className="stat-pill-value">{rank?.label ?? 'Explorer'}</span>
                  <span className="stat-pill-label">{(stats?.points ?? 148).toLocaleString()} XP</span>
                </span>
                <ChevronRightIcon />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.44, ease: EASE_OUT }}>
              <Link href="/achievements" className="stat-pill">
                <span className="stat-pill-icon butter"><FlameIcon size={17} /></span>
                <span className="stat-pill-text">
                  <span className="stat-pill-value">{stats?.streak ?? 0} Day Streak</span>
                  <span className="stat-pill-label">Keep it going</span>
                </span>
                <ChevronRightIcon />
              </Link>
            </motion.div>
          </div>

          {/* ── Continue Watching ── */}
          <div className="cw-head">
            <SectionTitle>Continue Watching</SectionTitle>
            <div className="cw-arrows">
              <button type="button" className="cw-arrow-btn" onClick={() => scrollContinueWatching(-1)} aria-label="Scroll left">
                <ChevronLeftIcon />
              </button>
              <button type="button" className="cw-arrow-btn" onClick={() => scrollContinueWatching(1)} aria-label="Scroll right">
                <ChevronRightIcon />
              </button>
            </div>
          </div>
          <div ref={cwRowRef} className="cw-row" style={{ marginBottom: 32 }}>
            {displayItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                animate={gridInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.07, ease: EASE_OUT }}
              >
                <FeedItemCard item={item} />
              </motion.div>
            ))}
          </div>

          {/* ── Recent Activity ── */}
          <SectionTitle>Recent Activity</SectionTitle>
          <div ref={activityRef} className="activity-list">
            {activities.map((evt, i) => {
              const badge = EVENT_BADGES[evt.event_type] ?? { label: 'Activity', bg: 'var(--sage)', color: 'var(--moss)' }
              return (
                <motion.div
                  key={`${evt.event_type}-${i}`}
                  className="activity-row"
                  initial={{ opacity: 0, x: -12 }}
                  animate={activityInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: EASE_OUT }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="activity-badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    {EVENT_LABELS[evt.event_type] ?? evt.event_type}
                  </span>
                  <small>{timeAgo(evt.event_ts)}</small>
                  <strong>+{evt.points} XP</strong>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ═══════════════════════ RIGHT PANEL ═══════════════════════ */}
        <ProfileSidePanel />
      </div>
    </>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
