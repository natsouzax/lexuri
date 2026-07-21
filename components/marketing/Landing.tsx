'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'

// Landing do projeto de pesquisa: uma tela, bem apresentada, sem funil.
// Paleta da marca: paper/ink/moss/sage/clay/butter (globals.css).
export default function Landing() {
  const { t } = useLang()

  const steps = [
    { icon: '🎵', bg: 'var(--sage)',                 title: t('landing.step1.title'), desc: t('landing.step1.desc') },
    { icon: '👆', bg: 'rgba(200,111,74,0.16)',       title: t('landing.step2.title'), desc: t('landing.step2.desc') },
    { icon: '🔁', bg: 'rgba(246,202,95,0.28)',       title: t('landing.step3.title'), desc: t('landing.step3.desc') },
  ]

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px 64px', textAlign: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--moss)',
          background: 'var(--sage)',
          padding: '5px 16px',
          borderRadius: 999,
        }}
      >
        {t('landing.badge')}
      </span>

      <h1
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontWeight: 900,
          fontSize: 'clamp(2rem, 6.5vw, 2.9rem)',
          lineHeight: 1.12,
          margin: '22px 0 14px',
          color: 'var(--ink)',
        }}
      >
        {t('landing.title')}
      </h1>

      <p style={{ fontSize: '1.02rem', color: 'var(--muted)', lineHeight: 1.65, margin: '0 auto 32px', maxWidth: 480 }}>
        {t('landing.body')}
      </p>

      <Link
        href="/register"
        style={{
          display: 'inline-block',
          padding: '15px 44px',
          fontSize: '1.05rem',
          fontWeight: 800,
          borderRadius: 16,
          background: 'var(--clay)',
          color: '#fff',
          textDecoration: 'none',
          boxShadow: '0 10px 24px rgba(200,111,74,0.35)',
          transition: 'transform 140ms ease, box-shadow 140ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 14px 30px rgba(200,111,74,0.45)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 10px 24px rgba(200,111,74,0.35)'
        }}
      >
        {t('landing.cta')}
      </Link>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 12 }}>{t('landing.time')}</p>

      {/* Mini-preview de letra sincronizada, no clima do player real */}
      <div
        style={{
          margin: '44px auto 0',
          maxWidth: 460,
          background: 'var(--dark-bg, #18211d)',
          borderRadius: 20,
          padding: '22px 26px',
          textAlign: 'left',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clay)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--butter)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,250,240,0.5)' }}>♪ Happy — Pharrell Williams</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 2, color: 'rgba(255,250,240,0.45)' }}>
          Clap along if you feel like a{' '}
          <span style={{ background: 'rgba(246,202,95,0.25)', color: '#f6ca5f', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>room without a roof</span>
          <br />
          <span style={{ color: '#fffaf0', fontWeight: 600 }}>
            Because I&apos;m{' '}
            <span style={{ background: 'rgba(200,111,74,0.3)', color: '#d97b54', borderRadius: 6, padding: '1px 6px', fontWeight: 800 }}>happy</span>
          </span>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 44, textAlign: 'left' }}>
        {steps.map((s, i) => (
          <div
            key={s.title}
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--ink)', marginBottom: 2 }}>
                <span style={{ color: 'var(--clay)', fontWeight: 900, marginRight: 6 }}>{i + 1}.</span>
                {s.title}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
