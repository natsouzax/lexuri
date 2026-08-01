'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { EASE_OUT } from '@/lib/easing'
import { createClient } from '@/lib/supabase-browser'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import { ChevronIcon, CloseIcon } from './Icons'
import NotificationBell from './NotificationBell'

// A escolha vale pra todas as páginas que usam o painel, e sobrevive ao reload.
const PANEL_KEY = 'lexuri_profile_panel'

interface StatsData {
  weekActivity: boolean[]
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  points: number
  streak: number
  total_reviews: number
  is_me: boolean
  display_name: string | null
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function initialsOf(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// Right-column companion for the app's main pages: profile card (avatar,
// greeting, weekly activity chart) + a weekly Top Learners preview. Fetches
// its own data so any page can drop it in without prop-drilling.
export default function ProfileSidePanel() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [weekActivity, setWeekActivity] = useState<boolean[]>(Array(7).fill(false))
  const [topLearners, setTopLearners] = useState<LeaderboardEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)
  const sideHidden = useHideOnScroll()

  // Lido só no cliente — ler localStorage no render quebraria a hidratação.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(PANEL_KEY) === 'collapsed')
    } catch { /* modo privado / storage bloqueado */ }
    setReady(true)
  }, [])

  function toggleCollapsed(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(PANEL_KEY, next ? 'collapsed' : 'open')
    } catch { /* idem */ }
  }

  // Escondido não busca nada: sem o `ready` o primeiro render dispararia as
  // três chamadas antes de sabermos que o usuário já tinha fechado o painel.
  useEffect(() => {
    if (!ready || collapsed) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      const meta = data.user?.user_metadata
      const name: string = meta?.full_name ?? data.user?.email?.split('@')[0] ?? 'there'
      setUsername(name.split(' ')[0])
    })

    apiFetch<StatsData>('/api/gamification/stats')
      .then((d) => setWeekActivity(d.weekActivity))
      .catch(() => {})

    apiFetch<LeaderboardResponse>('/api/gamification/leaderboard?window=weekly')
      .then((res) => setTopLearners(res.entries.slice(0, 4)))
      .catch(() => {})
  }, [ready, collapsed])

  const weekDisplay = [...weekActivity].reverse() // oldest → newest, left to right
  const weekDayLabels = (() => {
    const labels: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()])
    }
    return labels
  })()

  const profileName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? (username || 'You')
  const profileAvatar = user?.user_metadata?.avatar_url as string | undefined

  // O aside vira `display: contents` e some do grid; o `:has()` no CSS faz a
  // coluna principal esticar pra ocupar os 320px que sobraram.
  if (collapsed) {
    return (
      <aside className="dash-side is-collapsed">
        <button
          type="button"
          className="profile-panel-restore"
          onClick={() => toggleCollapsed(false)}
          title="Show your profile"
          aria-label="Show your profile"
        >
          <ChevronIcon direction="left" size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="dash-side">
      {/* Shrinks in sync with the top nav's hide-on-scroll animation. */}
      <motion.div
        className="profile-panel profile-panel--top"
        style={{ transformOrigin: 'top center' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, scale: sideHidden ? 0.88 : 1 }}
        transition={{
          opacity: { duration: 0.4, delay: 0.2, ease: EASE_OUT },
          y: { duration: 0.4, delay: 0.2, ease: EASE_OUT },
          scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <div className="profile-panel-head">
          <span className="section-title" style={{ margin: 0 }}>Your Profile</span>
          <button
            type="button"
            className="profile-panel-close"
            onClick={() => toggleCollapsed(true)}
            title="Hide this panel"
            aria-label="Hide this panel"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {profileAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profileAvatar} alt={profileName} className="profile-avatar-lg" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="profile-avatar-lg">{initialsOf(profileName)}</div>
        )}
        <div className="profile-greeting">{greeting()}, {username || 'there'}</div>
        <p className="profile-sub">Continue your journey and hit today&apos;s goal.</p>

        <div className="profile-icon-row">
          <NotificationBell />
          <Link href="/achievements" className="profile-icon-btn" aria-label="Achievements">
            <TrophyIcon />
          </Link>
        </div>

        <div className="week-chart">
          {weekDisplay.map((active, i) => (
            <div key={i} className="week-chart-bar-wrap">
              <div
                className={`week-chart-bar${active ? ' active' : ''}`}
                style={{ height: active ? '100%' : '22%' }}
              />
              <span className="week-chart-day">{weekDayLabels[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="profile-panel"
        style={{ transformOrigin: 'top center' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, scale: sideHidden ? 0.88 : 1 }}
        transition={{
          opacity: { duration: 0.4, delay: 0.3, ease: EASE_OUT },
          y: { duration: 0.4, delay: 0.3, ease: EASE_OUT },
          scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <div className="top-learners-head">
          <span className="section-title" style={{ margin: 0 }}>Top Learners</span>
          <Link href="/leaderboard">See All</Link>
        </div>
        {topLearners.length === 0 && (
          <p className="panel-copy">Study this week to join the ranking.</p>
        )}
        {topLearners.map((entry) => {
          const name = entry.display_name ?? (entry.is_me ? (username || 'You') : 'Learner')
          return (
            <div key={entry.user_id} className="top-learner-row">
              <span className="top-learner-avatar">{initialsOf(name)}</span>
              <span className="top-learner-info">
                <span className="top-learner-name">{entry.is_me ? 'You' : name}</span>
                <span className="top-learner-sub">{entry.streak} day streak</span>
              </span>
              <span className={`top-learner-rank${entry.is_me ? ' me' : ''}`}>#{entry.rank}</span>
            </div>
          )
        })}
      </motion.div>
    </aside>
  )
}

function TrophyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" /><path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" />
      <path d="M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" />
    </svg>
  )
}
