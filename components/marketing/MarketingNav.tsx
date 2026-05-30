'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing',  label: 'Pricing'  },
  { href: '/roadmap',  label: 'Roadmap'  },
  { href: '/about',    label: 'About'    },
]

export default function MarketingNav() {
  const pathname = usePathname()

  return (
    <nav className="mkt-nav">
      <div className="mkt-container mkt-nav-inner">
        <Link href="/" className="mkt-nav-logo">Verbly</Link>

        <div className="mkt-nav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`mkt-nav-link${pathname === href ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <Link href="/youtube" className="btn-mkt-primary mkt-nav-cta" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
            Open App →
          </Link>
        </div>
      </div>
    </nav>
  )
}
