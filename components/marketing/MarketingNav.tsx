'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/donate',   label: 'Donate'   },
  { href: '/demo',     label: 'Ver demo' },
  { href: '/roadmap',  label: 'Roadmap'  },
  { href: '/about',    label: 'About'    },
]

export default function MarketingNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="mkt-nav">
      <div className="mkt-container mkt-nav-inner">
        <Link href="/" className="mkt-nav-logo" onClick={() => setOpen(false)}>Lexuri</Link>

        {/* Desktop links */}
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

        {/* Mobile hamburger */}
        <button
          className="mkt-nav-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="5" y1="5" x2="17" y2="17" />
              <line x1="17" y1="5" x2="5" y2="17" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="19" y2="6" />
              <line x1="3" y1="11" x2="19" y2="11" />
              <line x1="3" y1="16" x2="19" y2="16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="mkt-nav-mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`mkt-nav-mobile-link${pathname === href ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mkt-nav-mobile-cta">
            <Link
              href="/youtube"
              className="btn-mkt-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setOpen(false)}
            >
              Open App →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
