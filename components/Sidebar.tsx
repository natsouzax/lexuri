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

const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: '/dashboard', label: 'Home', icon: 'H' }],
  },
  {
    label: 'Learn',
    items: [
      { href: '/feed', label: 'Feed', icon: 'F' },
      { href: '/youtube', label: 'YouTube', icon: 'Y' },
      { href: '/music', label: 'Music', icon: 'M' },
    ],
  },
  {
    label: null,
    items: [
      { href: '/review', label: 'Review', icon: 'R' },
      { href: '/flashcards', label: 'Library', icon: 'L' },
      { href: '/reports', label: 'Progress', icon: 'P' },
      { href: '/settings', label: 'Settings', icon: 'S' },
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
      <div>
        <Link href="/" className="sidebar-logo-link">
          <div className="sidebar-logo">Lexuri</div>
        </Link>
        <p className="sidebar-caption">AI / real content / fluency</p>

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
                  <span className="nav-letter">{item.icon}</span>
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
          <UserDropdown user={user} />
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
