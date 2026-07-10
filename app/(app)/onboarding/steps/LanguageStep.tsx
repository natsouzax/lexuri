'use client'

import { useEffect } from 'react'
import { LANGUAGES } from '@/lib/languages'
import DuoOption from '@/components/ui/DuoOption'

interface LanguageStepProps {
  nativeLang: string | null
  onSelect: (code: string) => void
}

export default function LanguageStep({ nativeLang, onSelect }: LanguageStepProps) {
  useEffect(() => {
    if (nativeLang) return
    const browserCode = navigator.language.split('-')[0]
    const match = LANGUAGES.find((l) => l.code === browserCode)
    if (match) onSelect(match.code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <h1 className="onboard-title">What&apos;s your native language?</h1>
      <p className="onboard-desc">We&apos;ll show platform tips in your language so you feel right at home.</p>
      <div className="onboard-options-grid">
        {LANGUAGES.map((lang) => (
          <DuoOption
            key={lang.code}
            selected={nativeLang === lang.code}
            onSelect={() => onSelect(lang.code)}
            label={`${lang.flag} ${lang.nativeName}`}
          />
        ))}
      </div>
    </div>
  )
}
