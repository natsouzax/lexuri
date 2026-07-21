'use client'

import { useEffect, useState } from 'react'
import { playSoft, playFanfare } from '@/lib/sfx'
import type { Flashcard } from '@/lib/types'
import { useLang } from '@/lib/i18n'

interface Props {
  cards: Flashcard[]
  onDone: () => void
  finishing: boolean
}

// Day 1: releitura calma das palavras salvas — só leitura, sem teste.
export default function Day1Read({ cards, onDone, finishing }: Props) {
  const { t } = useLang()
  const [index, setIndex] = useState(0)
  const card = cards[index]
  const isLast = index >= cards.length - 1

  function playAudio(word: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    u.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  // Pronúncia automática ao trocar de card.
  useEffect(() => {
    if (card) { playSoft(); playAudio(card.word) }
  }, [card?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 12 }}>
        {index + 1} {t('act.of')} {cards.length}
      </div>

      <div className="panel" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.6rem' }}>
            {card.word}
          </span>
          <button
            onClick={() => playAudio(card.word)}
            aria-label="Ouvir pronúncia"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            🔊
          </button>
        </div>
        <div style={{ fontSize: '1.05rem', color: 'var(--clay)', fontWeight: 700, margin: '10px 0 14px' }}>
          {card.translation}
        </div>
        {card.explanation && (
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
            {card.explanation}
          </p>
        )}
        {card.example && (
          <p style={{ fontSize: '0.85rem', color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
            “{card.example}”
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {index > 0 && (
          <button className="btn-secondary" onClick={() => setIndex((i) => i - 1)}>{t('act.prev')}</button>
        )}
        {!isLast ? (
          <button className="btn-primary" onClick={() => setIndex((i) => i + 1)}>{t('act.next')}</button>
        ) : (
          <button className="btn-primary" onClick={() => { playFanfare(); onDone() }} disabled={finishing} style={{ padding: '10px 28px' }}>
            {finishing ? <><span className="spinner" /> {t('act.saving')}</> : t('act.finishDay1')}
          </button>
        )}
      </div>
    </div>
  )
}
