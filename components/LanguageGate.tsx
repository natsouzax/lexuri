'use client'

import { useEffect, useState } from 'react'
import { useLang, LANG_OPTIONS, detectBrowserLang, type Lang } from '@/lib/i18n'

// Popup de primeira visita: pergunta a língua materna (os 12 idiomas do
// Lexuri original + inglês). Antes da escolha, todo o app fica em inglês.
export default function LanguageGate() {
  const { chosen, setLang } = useLang()
  const [detected, setDetected] = useState<Lang | null>(null)

  useEffect(() => { setDetected(detectBrowserLang()) }, [])

  if (chosen) return null

  // Sugestão do navegador aparece primeiro na lista.
  const options = detected
    ? [...LANG_OPTIONS].sort((a, b) => (a.id === detected ? -1 : b.id === detected ? 1 : 0))
    : LANG_OPTIONS

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
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-lg)',
          padding: '30px 26px',
          maxWidth: 460,
          width: '100%',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🌍</div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.35rem', margin: '0 0 6px', color: 'var(--ink)' }}>
          What&apos;s your native language?
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 18px' }}>
          We&apos;ll use it to translate words and adapt the app for you.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
            overflowY: 'auto',
            paddingRight: 2,
          }}
        >
          {options.map((opt) => {
            const suggested = opt.id === detected
            return (
              <button
                key={opt.id}
                onClick={() => setLang(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${suggested ? 'var(--moss)' : 'var(--line)'}`,
                  background: suggested ? 'var(--sage)' : '#fff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'border-color 140ms ease, transform 140ms ease',
                  gridColumn: suggested ? '1 / -1' : undefined,
                  justifyContent: suggested ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--moss)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = suggested ? 'var(--moss)' : 'var(--line)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{opt.flag}</span>
                {opt.label}
                {suggested && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--moss)' }}>· suggested</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
