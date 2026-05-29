'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/youtube', label: 'YouTube Studio', icon: '▶' },
  { href: '/flashcards', label: 'Flashcards', icon: '⊞' },
  { href: '/music', label: 'Music Lab', icon: '♪' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Verbly</div>
      <p className="sidebar-caption">
        Learn English from the videos and music you already love.
      </p>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${pathname.startsWith(item.href) ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <hr className="sidebar-divider" />

      <div className="sidebar-rhythm">
        <strong>Study rhythm</strong>
        1. Bring content in
        <br />
        2. Extract useful language
        <br />
        3. Review with spaced repetition
      </div>
    </aside>
  )
}
