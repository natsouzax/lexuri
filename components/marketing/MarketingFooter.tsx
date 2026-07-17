'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const PRODUCT_LINKS = [
  { href: '/features',  label: 'Features'  },
  { href: '/feed',      label: 'Lessons'   },
  { href: '/youtube',   label: 'Open App'  },
]

const COMPANY_LINKS = [
  { href: '/about',    label: 'About'    },
  { href: '/contact',  label: 'Contact'  },
  { href: '/feedback', label: 'Feedback' },
]

const LEGAL_LINKS = [
  { href: '/terms',   label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy'   },
]

export default function MarketingFooter() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px 0px' })

  return (
    <footer className="mkt-footer" ref={ref}>
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.05, ease: EASE_OUT }}
          >
            <Link href="/" className="mkt-footer-logo">
              <Image src="/logo-dark.svg" alt="Lexuri" width={110} height={28} />
            </Link>
            <p className="mkt-footer-tagline">
              Learn English from the videos and music you already love.
              AI-powered chunk detection and spaced repetition.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
          >
            <p className="mkt-footer-heading">Product</p>
            {PRODUCT_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="mkt-footer-link">{label}</Link>
            ))}
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.19, ease: EASE_OUT }}
          >
            <p className="mkt-footer-heading">Company</p>
            {COMPANY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="mkt-footer-link">{label}</Link>
            ))}
          </motion.div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© {new Date().getFullYear()} Lexuri. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="mkt-footer-link" style={{ display: 'inline', marginBottom: 0, fontSize: '0.75rem' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
