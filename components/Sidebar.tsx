'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'
import { useLang, type DictKey } from '@/lib/i18n'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// Navegação principal do app: Overview (dashboard com XP/streak/missões),
// Songs (feed por nível), Review (ciclo D1/D2/D3 + SRS) e Library.
const NAV_ITEMS: { href: string; labelKey: DictKey; Icon: () => React.ReactElement }[] = [
  { href: '/dashboard',  labelKey: 'nav.overview', Icon: OverviewIcon },
  { href: '/feed',       labelKey: 'nav.songs',    Icon: LibraryIcon },
  { href: '/albums',     labelKey: 'nav.albums',   Icon: AlbumIcon },
  { href: '/review',     labelKey: 'nav.review',   Icon: ReviewIcon },
  { href: '/flashcards', labelKey: 'nav.library',  Icon: CardsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLang()
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
                    <span>{t(item.labelKey)}</span>
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
        {user ? (
          <div className="sidebar-user-row">
            <div className="sidebar-user-dropdown">
              <UserDropdown user={user} />
            </div>
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

function AlbumIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
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


