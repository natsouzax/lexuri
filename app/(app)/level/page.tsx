'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { STUDY_LEVELS, songsForLevel, type StudyLevel } from '@/lib/mvp'

// Onboarding inteiro do MVP: um pick de nível que grava no perfil e já
// abre a primeira música daquele nível — sem quiz, sem fricção.
export default function LevelPage() {
  const router = useRouter()
  const [saving, setSaving] = useState<StudyLevel | null>(null)

  async function handlePick(level: StudyLevel) {
    setSaving(level)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Coluna nova (migration 0024) — se ainda não aplicada, segue sem gravar.
        await supabase.from('profiles').update({ study_level: level }).eq('id', user.id)
      }
    } catch {}
    const first = songsForLevel(level)[0]
    router.push(first ? `/feed/${first.id}` : '/feed')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px' }}>
      <div className="app-hero" style={{ textAlign: 'center' }}>
        <h1 className="app-hero-title">Qual é o seu nível de inglês?</h1>
        <p className="app-hero-subtitle">Vamos abrir uma música de verdade, no nível certo pra você.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        {(Object.keys(STUDY_LEVELS) as StudyLevel[]).map((level) => {
          const info = STUDY_LEVELS[level]
          return (
            <button
              key={level}
              onClick={() => handlePick(level)}
              disabled={saving !== null}
              className="settings-nav-card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', opacity: saving && saving !== level ? 0.5 : 1 }}
            >
              <span className="settings-nav-icon">{info.icon}</span>
              <div>
                <div className="settings-nav-title">{info.label}</div>
                <div className="settings-nav-desc">{info.desc}</div>
              </div>
              <span className="settings-nav-arrow">{saving === level ? <span className="spinner" /> : '→'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
