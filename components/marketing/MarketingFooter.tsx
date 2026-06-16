import Link from 'next/link'
import Image from 'next/image'

const PRODUCT_LINKS = [
  { href: '/features', label: 'Features'  },
  { href: '/plans',    label: 'Premium'   },
  { href: '/roadmap',  label: 'Roadmap'   },
  { href: '/youtube',  label: 'Open App'  },
]

const COMPANY_LINKS = [
  { href: '/about',   label: 'About'   },
  { href: '/contact', label: 'Contact' },
]

export default function MarketingFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          {/* Brand */}
          <div>
            <Link href="/" className="mkt-footer-logo">
              <Image src="/logo-dark.svg" alt="Lexuri" width={110} height={28} />
            </Link>
            <p className="mkt-footer-tagline">
              Learn English from the videos and music you already love.
              AI-powered chunk detection and spaced repetition.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mkt-footer-heading">Product</p>
            {PRODUCT_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="mkt-footer-link">{label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <p className="mkt-footer-heading">Company</p>
            {COMPANY_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="mkt-footer-link">{label}</Link>
            ))}
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>© {new Date().getFullYear()} Lexuri. All rights reserved.</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Built for serious learners.</span>
        </div>
      </div>
    </footer>
  )
}
