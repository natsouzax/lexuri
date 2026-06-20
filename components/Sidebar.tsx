'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'
import type { Rank, XPProgressInfo } from '@/lib/gamification'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface SidebarStats {
  points: number
  rank: Rank
  xpProgress: XPProgressInfo
}

interface UsageInfo {
  isPremium: boolean
  ytImports: number
  musicImports: number
  feedItems: number
  limits: { weeklyYoutubeImports: number; weeklyMusicImports: number; feedItems: number }
}

const NAV_GROUPS: {
  label: string | null
  items: { href: string; label: string; Icon: () => React.ReactElement }[]
}[] = [
  {
    label: 'Learn',
    items: [
      { href: '/youtube', label: 'YouTube', Icon: YoutubeIcon },
      { href: '/music', label: 'Music', Icon: MusicIcon },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/flashcards',   label: 'Library',      Icon: LibraryIcon },
      { href: '/review',       label: 'Review',       Icon: ReviewIcon },
      { href: '/achievements', label: 'Conquistas',   Icon: TrophyIcon },
      { href: '/leaderboard',  label: 'Leaderboard',  Icon: TrophyIcon },
    ],
  },
  {
    label: null,
    items: [
      { href: '/settings/billing', label: 'Upgrade to Premium', Icon: StarIcon },
    ],
  },
]

function UsageBar({ used, max }: { used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100))
  const color = pct >= 100 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#4caf50'
  return (
    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,250,240,0.08)', overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', borderRadius: 99, background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
      />
    </div>
  )
}

function UsageWidget({ usage }: { usage: UsageInfo }) {
  const { ytImports, musicImports, feedItems, limits } = usage
  const ytLeft = Math.max(0, limits.weeklyYoutubeImports - ytImports)
  const muLeft = Math.max(0, limits.weeklyMusicImports - musicImports)
  const fdLeft = Math.max(0, limits.feedItems - feedItems)

  const rows = [
    { label: 'Feed lessons', used: feedItems, max: limits.feedItems, left: fdLeft },
    { label: 'YouTube', used: ytImports, max: limits.weeklyYoutubeImports, left: ytLeft },
    { label: 'Music', used: musicImports, max: limits.weeklyMusicImports, left: muLeft },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.45, ease: EASE_OUT }}
      style={{ margin: '10px 0 4px', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,250,240,0.04)', border: '1px solid rgba(255,250,240,0.07)' }}
    >
      <div style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dark-muted)', marginBottom: 10 }}>
        Free plan · this week
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(({ label, used, max, left }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,250,240,0.5)' }}>{label}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: left === 0 ? '#ef4444' : 'rgba(255,250,240,0.6)' }}>
                {left === 0 ? 'limit reached' : `${left}/${max} left`}
              </span>
            </div>
            <UsageBar used={used} max={max} />
          </div>
        ))}
      </div>

      <a href="/settings/billing" style={{ display: 'block', marginTop: 10, textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--clay-bright)', textDecoration: 'none', letterSpacing: '0.03em' }}>
        Go unlimited →
      </a>
    </motion.div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetch('/api/gamification/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.rank) setStats({ points: d.points, rank: d.rank, xpProgress: d.xpProgress })
      })
      .catch(() => {})

    fetch('/api/usage')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && 'isPremium' in d) setUsage(d) })
      .catch(() => {})

    return () => subscription.unsubscribe()
  }, [])

  let navItemIndex = 0

  return (
    <aside className="sidebar">
      <div style={{ flex: 1 }}>
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label ?? groupIndex} className="sidebar-nav-group">
              {group.label && <div className="sidebar-nav-label">{group.label}</div>}
              {group.items.map((item) => {
                const delay = 0.08 + navItemIndex++ * 0.055
                const isActive = pathname.startsWith(item.href)
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay, ease: EASE_OUT }}
                    whileHover={{ x: 3 }}
                    style={{ originX: 0 }}
                  >
                    <Link
                      href={item.href}
                      className={`nav-link${isActive ? ' active' : ''}`}
                    >
                      <span className="nav-icon">
                        <item.Icon />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </nav>

        <hr className="sidebar-divider" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35, ease: EASE_OUT }}
        >
          {stats ? (
            <div className="sidebar-rank-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <motion.span
                  style={{ color: stats.rank.color, fontSize: '0.95rem', fontWeight: 900 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, delay: 0.6, repeat: Infinity, repeatDelay: 8 }}
                >
                  {stats.rank.icon}
                </motion.span>
                <span style={{ color: 'var(--paper)', fontWeight: 700, fontSize: '0.8rem' }}>
                  {stats.rank.label}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--dark-muted)', fontSize: '0.65rem', fontWeight: 700 }}>
                  {stats.points.toLocaleString()} XP
                </span>
              </div>
              <div className="xp-bar-track">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.xpProgress.progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              {stats.xpProgress.nextRank && (
                <div style={{ marginTop: 5, fontSize: '0.62rem', color: 'var(--dark-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{stats.xpProgress.progressPct}%</span>
                  <span>Next: {stats.xpProgress.nextRank.label}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="sidebar-rank-card">
              <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 4, borderRadius: 99 }} />
            </div>
          )}
        </motion.div>

        {usage && !usage.isPremium && (
          <UsageWidget usage={usage} />
        )}
      </div>

      <motion.div
        className="sidebar-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Link
          href="/feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 8,
            color: 'var(--dark-muted)',
            fontSize: '0.76rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 140ms, color 140ms',
            marginBottom: 10,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,250,240,0.06)'
            ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,250,240,0.7)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--dark-muted)'
          }}
        >
          <FeedbackIcon />
          <span>Send feedback</span>
        </Link>
        <hr className="sidebar-divider" style={{ marginBottom: 14 }} />
        {user ? (
          <div className="sidebar-user-row">
            <div className="sidebar-user-dropdown">
              <UserDropdown user={user} />
            </div>
            <Link href="/settings" className="sidebar-settings-btn" aria-label="Settings" title="Settings">
              <GearIcon />
            </Link>
          </div>
        ) : (
          <Link href="/" className="sidebar-site-link">
            <span style={{ fontSize: '0.8rem' }}>Back</span>
            <span>Public site</span>
          </Link>
        )}
      </motion.div>
    </aside>
  )
}

function YoutubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function FeedbackIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
