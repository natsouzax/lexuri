'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

export function MarketingHeader() {
  const { t } = useLang()
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <Link href="/" style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.35rem', color: 'var(--ink)', textDecoration: 'none' }}>
        Lexuri<span style={{ color: 'var(--clay)' }}>.</span>
      </Link>
      <Link
        href="/login"
        style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--moss)', textDecoration: 'none', border: '1.5px solid var(--sage)', background: 'var(--sage)', padding: '7px 20px', borderRadius: 999 }}
      >
        {t('landing.login')}
      </Link>
    </header>
  )
}

export function MarketingFooter() {
  const { t } = useLang()
  return (
    <footer style={{ padding: '32px 24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)' }}>
      <Link href="/privacy" style={{ color: 'var(--muted)', marginRight: 16 }}>{t('landing.privacy')}</Link>
      <Link href="/terms" style={{ color: 'var(--muted)' }}>{t('landing.terms')}</Link>
    </footer>
  )
}
