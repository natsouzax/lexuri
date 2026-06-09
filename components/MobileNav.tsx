'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Home',    icon: '◉' },
  { href: '/feed',       label: 'Feed',    icon: '◈' },
  { href: '/review',     label: 'Review',  icon: '↺' },
  { href: '/youtube',    label: 'YouTube', icon: '▶' },
  { href: '/music',      label: 'Music',   icon: '♪' },
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
