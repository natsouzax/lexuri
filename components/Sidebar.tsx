'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import UserDropdown from '@/components/auth/UserDropdown'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/feed',       label: 'Learning Feed',  icon: '◈' },
  { href: '/review',     label: 'Review',         icon: '↺' },
  { href: '/youtube',    label: 'YouTube Studio', icon: '▶' },
  { href: '/flashcards', label: 'Flashcards',     icon: '⊞' },
  { href: '/music',      label: 'Music Lab',       icon: '♪' },
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
      <div>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo">Verbly</div>
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

        <hr className="sidebar-divider" />

        <div className="sidebar-rhythm">
          <strong>Study rhythm</strong>
          1. Bring content in
          <br />
          2. Extract chunks
          <br />
          3. Review with SRS
        </div>
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
