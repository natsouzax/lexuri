'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'
import type { Rank, XPProgressInfo } from '@/lib/gamification'

interface SidebarStats {
  points: number
  rank: Rank
  xpProgress: XPProgressInfo
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
      { href: '/flashcards', label: 'Library', Icon: LibraryIcon },
      { href: '/leaderboard', label: 'Leaderboard', Icon: TrophyIcon },
    ],
  },
  {
    label: null,
    items: [
      { href: '/supportus', label: 'Support us', Icon: HeartIcon },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<SidebarStats | null>(null)

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

    return () => subscription.unsubscribe()
  }, [])

  return (
    <aside className="sidebar">
      <div style={{ flex: 1 }}>
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label ?? groupIndex} className="sidebar-nav-group">
              {group.label && <div className="sidebar-nav-label">{group.label}</div>}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${pathname.startsWith(item.href) ? ' active' : ''}`}
                >
                  <span className="nav-icon">
                    <item.Icon />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <hr className="sidebar-divider" />

        {stats ? (
          <div className="sidebar-rank-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ color: stats.rank.color, fontSize: '0.95rem', fontWeight: 900 }}>
                {stats.rank.icon}
              </span>
              <span style={{ color: 'var(--paper)', fontWeight: 700, fontSize: '0.8rem' }}>
                {stats.rank.label}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--dark-muted)', fontSize: '0.65rem', fontWeight: 700 }}>
                {stats.points.toLocaleString()} XP
              </span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${stats.xpProgress.progressPct}%` }} />
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
      </div>

      <div className="sidebar-bottom">
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
      </div>
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

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
