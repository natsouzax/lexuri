'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

// Chrome do site público usando o nav/footer escuros do design original.
export function MarketingHeader() {
  const { t } = useLang()
  return (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-nav-logo">
          Lexuri<span style={{ color: 'var(--clay-bright)' }}>.</span>
        </Link>
        <div className="mkt-nav-links">
          <Link href="/login" className="mkt-nav-link">{t('landing.login')}</Link>
          <Link href="/register" className="btn-mkt-primary mkt-nav-cta" style={{ padding: '9px 22px', fontSize: '0.85rem' }}>
            {t('landing.cta')}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export function MarketingFooter() {
  const { t } = useLang()
  return (
    <footer style={{ background: 'var(--dark-bg)', padding: '28px 24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--dark-muted)' }}>
      <Link href="/privacy" style={{ color: 'var(--dark-muted)', marginRight: 16 }}>{t('landing.privacy')}</Link>
      <Link href="/terms" style={{ color: 'var(--dark-muted)' }}>{t('landing.terms')}</Link>
    </footer>
  )
}
