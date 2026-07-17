'use client'

import { useEffect, useState } from 'react'

export const NATIVE_LANG_KEY = 'lexuri-native-lang'

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
  { code: 'es',    label: 'Español',         flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',        flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',         flag: '🇩🇪' },
  { code: 'it',    label: 'Italiano',        flag: '🇮🇹' },
  { code: 'ja',    label: '日本語',           flag: '🇯🇵' },
  { code: 'ko',    label: '한국어',           flag: '🇰🇷' },
  { code: 'zh',    label: '中文',             flag: '🇨🇳' },
  { code: 'ar',    label: 'العربية',          flag: '🇸🇦' },
  { code: 'tr',    label: 'Türkçe',          flag: '🇹🇷' },
  { code: 'ru',    label: 'Русский',         flag: '🇷🇺' },
  { code: 'hi',    label: 'हिंदी',            flag: '🇮🇳' },
]

function detectLang(): string | null {
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('pt')) return 'pt-BR'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('de')) return 'de'
  if (nav.startsWith('it')) return 'it'
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('ko')) return 'ko'
  if (nav.startsWith('zh')) return 'zh'
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('tr')) return 'tr'
  if (nav.startsWith('ru')) return 'ru'
  if (nav.startsWith('hi')) return 'hi'
  return null
}

export default function LanguagePicker() {
  const [open, setOpen] = useState(false)
  const [detected, setDetected] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem(NATIVE_LANG_KEY)) {
      setDetected(detectLang())
      setOpen(true)
    }
  }, [])

  function select(code: string) {
    localStorage.setItem(NATIVE_LANG_KEY, code)
    window.dispatchEvent(new Event('lexuri-lang-changed'))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="lang-overlay" role="dialog" aria-modal="true" aria-label="Select your native language">
      <div className="lang-modal">
        <div className="lang-modal-accent" />
        <div className="lang-modal-body">
          <p className="lang-modal-eyebrow">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 10c1.5-4 10.5-4 12 0s-10.5 4-12 0Z" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="1" x2="10" y2="19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Lexuri &mdash; personalise your experience
          </p>
          <h2 className="lang-modal-title">What&apos;s your native language?</h2>
          <p className="lang-modal-sub">
            We&apos;ll show translations in the demo so you understand the examples right away.
          </p>

          <div className="lang-grid">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`lang-btn${detected === l.code ? ' lang-btn-detected' : ''}`}
                onClick={() => select(l.code)}
              >
                <span className="lang-flag">{l.flag}</span>
                <span className="lang-label">{l.label}</span>
                {detected === l.code && (
                  <span className="lang-detected-badge">Detected</span>
                )}
              </button>
            ))}
          </div>

          <hr className="lang-divider" />
          <button className="lang-skip" onClick={() => select('en')}>
            Skip — show English only
          </button>
        </div>
      </div>
    </div>
  )
}
