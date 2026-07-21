'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// Protótipo de validação: só o essencial pra quem nunca usou o produto —
// Lições (o feed direcionado por nível) e Revisão (o loop de flashcards).
// Sem gamificação/leaderboard/conquistas — reduz ruído pra quem está
// testando pela primeira vez.
const NAV_ITEMS: { href: string; label: string; Icon: () => React.ReactElement }[] = [
  { href: '/dashboard',  label: 'Overview', Icon: OverviewIcon },
  { href: '/feed',       label: 'Lessons',  Icon: LibraryIcon },
  { href: '/flashcards', label: 'My Cards', Icon: CardsIcon },
  { href: '/review',     label: 'Review',   Icon: ReviewIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <aside className="sidebar">
      <div style={{ flex: 1 }}>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            {NAV_ITEMS.map((item, i) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 + i * 0.06, ease: EASE_OUT }}
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
        </nav>
      </div>

      <motion.div
        className="sidebar-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
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

function OverviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
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

function CardsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 3h14v14" />
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
