'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'
import type { Rank, XPProgressInfo } from '@/lib/gamification'
import { useLang, type DictKey } from '@/lib/i18n'

interface AppStats {
  points: number
  rank: Rank
  xpProgress: XPProgressInfo
}

const NAV_ITEMS: Array<{ href: string; labelKey: DictKey; icon: React.ReactNode }> = [
  { href: '/dashboard', labelKey: 'nav.overview', icon: <HomeIcon /> },
  { href: '/feed', labelKey: 'nav.songs', icon: <FeedIcon /> },
  { href: '/review', labelKey: 'nav.review', icon: <ProgressIcon /> },
  { href: '/flashcards', labelKey: 'nav.library', icon: <CardsIcon /> },
]

interface Props {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function AppTopNav({ sidebarOpen, onToggleSidebar }: Props) {
  const pathname = usePathname()
  const { t } = useLang()
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
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.rank) setStats({ points: d.points, rank: d.rank, xpProgress: d.xpProgress }) })
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

        <Link href="/dashboard" className="app-top-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--clay)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>L</span>
          Lexuri
        </Link>

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
                {t(item.labelKey)}
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
              title={`${stats.rank.label} · ${stats.points.toLocaleString()} XP`}
            >
              <span style={{ color: stats.rank.color, fontWeight: 900, fontSize: '0.9rem' }}>{stats.rank.icon}</span>
              <span className="app-top-xp-label">{stats.points.toLocaleString()} XP</span>
            </motion.div>
          )}

          <div className="app-top-user">
            {user && <UserDropdown user={user} />}
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
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-top-mobile-link${pathname.startsWith(item.href) ? ' active' : ''}`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
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

function CardsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 3h14v14" />
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

