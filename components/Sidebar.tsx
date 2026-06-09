'use client'

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

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',      icon: '◉' },
  { href: '/feed',       label: 'Learning Feed',   icon: '◈' },
  { href: '/review',     label: 'Review',          icon: '↺' },
  { href: '/youtube',    label: 'YouTube Studio',  icon: '▶' },
  { href: '/flashcards', label: 'Flashcards',      icon: '⊞' },
  { href: '/music',      label: 'Music Lab',       icon: '♪' },
  { href: '/leaderboard', label: 'Leaderboard',    icon: '★' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser]   = useState<User | null>(null)
  const [stats, setStats] = useState<SidebarStats | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Fetch rank/XP for sidebar widget
    fetch('/api/gamification/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.rank) setStats({ points: d.points, rank: d.rank, xpProgress: d.xpProgress })
      })
      .catch(() => {/* silent */})

    return () => subscription.unsubscribe()
  }, [])

  return (
    <aside className="sidebar">
      <div>
        <Link href="/" className="sidebar-logo-link">
          <div className="sidebar-logo">Lexuri</div>
        </Link>
        <p className="sidebar-caption">AI · Chunks · Fluency</p>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${pathname.startsWith(item.href) ? ' active' : ''}`}
            >
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/donate"
          className={`nav-link${pathname.startsWith('/donate') ? ' active' : ''}`}
          style={{ color: 'var(--clay-bright)', marginTop: 4 }}
        >
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>♥</span>
          <span>Support us</span>
        </Link>

        <hr className="sidebar-divider" />

        {/* Rank widget */}
        {stats ? (
          <div style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(255,250,240,0.06)',
            border: '1px solid var(--dark-border)',
          }}>
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
                <span>→ {stats.xpProgress.nextRank.label}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,250,240,0.04)' }}>
            <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 4, borderRadius: 99 }} />
          </div>
        )}
      </div>

      <div className="sidebar-bottom">
        <hr className="sidebar-divider" style={{ marginBottom: 14 }} />
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <Link href="/" className="sidebar-site-link">
            <span style={{ fontSize: '0.8rem' }}>←</span>
            <span>Public site</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
