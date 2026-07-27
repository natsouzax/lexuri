'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import PixelPortrait from './PixelPortrait'

// Chrome do site público usando o nav/footer escuros do design original.
export function MarketingHeader() {
  const { t } = useLang()
  return (
    <nav className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link href="/" className="mkt-nav-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--clay)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', color: '#fff' }}>L</span>
          <span>Lexuri<span style={{ color: 'var(--clay-bright)' }}>.</span></span>
        </Link>
        <div className="mkt-nav-links">
          <Link href="/feedback" className="mkt-nav-link">Feedback</Link>
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
    <footer className="mkt-footer">
      <div className="mkt-container">
        <div className="mkt-footer-grid">
          <div>
            <Link href="/" className="mkt-footer-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--clay)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>L</span>
              <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', color: 'var(--paper)' }}>
                Lexuri<span style={{ color: 'var(--clay-bright)' }}>.</span>
              </span>
            </Link>
            <p className="mkt-footer-tagline">Learn English from the videos and music you already love.</p>

            <div className="mkt-footer-credit">
              <PixelPortrait />
              <div>
                <div className="mkt-footer-credit-name">Natan de Souza Oliveira</div>
                <div className="mkt-footer-credit-role">Creator &amp; developer</div>
              </div>
            </div>
          </div>

          <div>
            <div className="mkt-footer-heading">Contact</div>
            <a href="mailto:oliveira.natan.dev@gmail.com" className="mkt-footer-link">oliveira.natan.dev@gmail.com</a>
            <a href="mailto:natanoliveiraad855@gmail.com" className="mkt-footer-link">natanoliveiraad855@gmail.com</a>
          </div>

          <div>
            <div className="mkt-footer-heading">Research advisor</div>
            <span className="mkt-footer-link" style={{ color: 'var(--paper)', fontWeight: 700 }}>Karenyne de Faria Cunha</span>
            <a href="mailto:contato@karenynef.com.br" className="mkt-footer-link">contato@karenynef.com.br</a>
          </div>
        </div>

        <div className="mkt-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Lexuri. A research project.</span>
          <div>
            <Link href="/feedback" style={{ color: 'var(--dark-muted)', marginRight: 16, textDecoration: 'none' }}>Feedback</Link>
            <Link href="/privacy" style={{ color: 'var(--dark-muted)', marginRight: 16, textDecoration: 'none' }}>{t('landing.privacy')}</Link>
            <Link href="/terms" style={{ color: 'var(--dark-muted)', textDecoration: 'none' }}>{t('landing.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
