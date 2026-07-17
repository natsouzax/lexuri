'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/lessons',  label: 'Lessons'  },
  { href: '/demo',     label: 'Demo'     },
  { href: '/about',    label: 'About'    },
]

export default function MarketingNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className="mkt-nav"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: scrolled
          ? 'rgba(24, 33, 29, 0.98)'
          : 'rgba(24, 33, 29, 0.88)',
        boxShadow: scrolled
          ? '0 2px 32px rgba(0,0,0,0.38)'
          : '0 1px 0 rgba(255,250,240,0.06)',
        transition: 'background 280ms ease, box-shadow 280ms ease',
      }}
    >
      <div className="mkt-container mkt-nav-inner">
        <Link href="/" className="mkt-nav-logo" onClick={() => setOpen(false)}>
          <Image src="/logo-dark.svg" alt="Lexuri" width={124} height={32} priority />
        </Link>

        {/* Desktop links */}
        <div className="mkt-nav-links">
          {NAV_LINKS.map(({ href, label }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                className={`mkt-nav-link${pathname === href ? ' active' : ''}`}
              >
                {label}
              </Link>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Link
              href="/youtube"
              className="btn-mkt-primary mkt-nav-cta"
              style={{ padding: '8px 20px', fontSize: '0.82rem' }}
            >
              Open App →
            </Link>
          </motion.div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mkt-nav-hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.svg
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                width="22" height="22" viewBox="0 0 22 22"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              >
                <line x1="5" y1="5" x2="17" y2="17" />
                <line x1="17" y1="5" x2="5" y2="17" />
              </motion.svg>
            ) : (
              <motion.svg
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                width="22" height="22" viewBox="0 0 22 22"
                fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="19" y2="6" />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="mkt-nav-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {NAV_LINKS.map(({ href, label }, i) => (
              <motion.div
                key={href}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.055, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={href}
                  className={`mkt-nav-mobile-link${pathname === href ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              className="mkt-nav-mobile-cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: NAV_LINKS.length * 0.055, duration: 0.28 }}
            >
              <Link
                href="/youtube"
                className="btn-mkt-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setOpen(false)}
              >
                Open App →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
