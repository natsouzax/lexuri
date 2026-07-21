'use client'

import { useLang, LANG_OPTIONS } from '@/lib/i18n'

// Popup de primeira visita: pergunta a língua materna. Antes da escolha,
// todo o app fica em inglês (padrão do LangProvider).
export default function LanguageGate() {
  const { chosen, setLang } = useLang()

  if (chosen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(24, 33, 29, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-lg)',
          padding: '36px 32px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>🌍</div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 8px', color: 'var(--ink)' }}>
          What&apos;s your native language?
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
          We&apos;ll use it to translate words and adapt the app for you.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setLang(opt.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 18px',
                borderRadius: 14,
                border: '1.5px solid var(--line)',
                background: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--ink)',
                cursor: 'pointer',
                transition: 'border-color 140ms ease, transform 140ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--moss)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
