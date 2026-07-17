'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'
import type { Rank, XPProgressInfo } from '@/lib/gamification'

interface AppStats {
  points: number
  rank: Rank
  xpProgress: XPProgressInfo
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: <HomeIcon /> },
  { href: '/feed', label: 'Feed', icon: <FeedIcon /> },
  { href: '/reports', label: 'Progress', icon: <ProgressIcon /> },
]

const MOBILE_EXTRA_ITEMS = [
  { href: '/flashcards', label: 'Library' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/settings', label: 'Settings' },
]

interface Props {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function AppTopNav({ sidebarOpen, onToggleSidebar }: Props) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<AppStats | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <motion.header
      className="app-top-nav"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="app-top-nav-inner">
        <button
          className="app-top-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
        >
          <PanelIcon />
        </button>

        <Link href="/" className="app-top-logo">Lexuri</Link>

        <nav className="app-top-links">
          {NAV_ITEMS.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={item.href}
                className={`app-top-link${pathname.startsWith(item.href) ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="app-top-right">
          {stats && (
            <motion.div
              className="app-top-xp"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{ color: stats.rank.color, fontWeight: 900, fontSize: '0.9rem' }}>
                {stats.rank.icon}
              </span>
              <span className="app-top-xp-label">{stats.points.toLocaleString()} XP</span>
            </motion.div>
          )}

          <div className="app-top-user">
            {user && <UserDropdown user={user} />}
            <Link
              href="/settings"
              className="app-top-settings-btn"
              aria-label="Settings"
              title="Settings"
            >
              <GearIcon />
            </Link>
          </div>

          <button
            className={`app-top-hamburger${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="app-top-mobile-menu">
          {[...NAV_ITEMS, ...MOBILE_EXTRA_ITEMS].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-top-mobile-link${pathname.startsWith(item.href) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {stats && (
            <div className="app-top-mobile-xp">
              <span style={{ color: stats.rank.color, fontWeight: 900 }}>{stats.rank.icon}</span>
              <span>{stats.rank.label}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--dark-muted)', fontSize: '0.75rem' }}>
                {stats.points.toLocaleString()} XP
              </span>
            </div>
          )}
        </nav>
      )}
    </motion.header>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  )
}

function FeedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ProgressIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function PanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
