'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: 'H' },
  { href: '/feed', label: 'Learn', icon: 'F' },
  { href: '/review', label: 'Review', icon: 'R' },
  { href: '/flashcards', label: 'Library', icon: 'L' },
  { href: '/reports', label: 'Progress', icon: 'P' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${active ? ' active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
