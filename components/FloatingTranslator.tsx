'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getNativeLangName } from '@/lib/i18n'
import { awardXP } from '@/lib/xp'
import { normalizeFlashcard } from '@/lib/types'
import type { Flashcard } from '@/lib/types'

interface WordDef {
  word: string
  partOfSpeech: string
  definition: string
  example: string
  translation: string
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Tradutor de socorro do app: bolinha flutuante → mini painel English→idioma
// nativo. Aceita texto digitado OU seleção na tela; oferece ouvir (TTS) e
// salvar na biblioteca (vira flashcard no SRS). UI em inglês (imersão).
export default function FloatingTranslator() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Captura de seleção de texto em qualquer lugar do app.
  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection()?.toString().trim()
      if (sel && sel.length > 0 && sel.length <= 80 && /[a-zA-Z]/.test(sel)) {
        setInput(sel)
        setOpen(true)
      }
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [])

  // Traduz com debounce sempre que o texto muda e o painel está aberto.
  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    const text = input.trim()
    setSaved(false)
    if (!text) { setTranslation(''); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { translation } = await apiFetch<{ translation: string }>('/api/llm/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: text, native_lang: getNativeLangName() }),
        })
        setTranslation(translation)
      } catch {
        setTranslation('—')
      } finally {
        setLoading(false)
      }
    }, 450)
    return () => clearTimeout(debounceRef.current)
  }, [input, open])

  function speak() {
    const text = input.trim()
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  async function save() {
    const text = input.trim()
    if (!text || saving) return
    setSaving(true)
    try {
      const def = await apiFetch<WordDef>('/api/llm/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: text, native_lang: getNativeLangName() }),
      })
      const card = normalizeFlashcard({
        word: def.word,
        translation: def.translation,
        explanation: `(${def.partOfSpeech}) ${def.definition}`,
        example: def.example,
      })
      if (card) {
        await apiFetch<Flashcard[]>('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: [card] }),
        })
        awardXP('word_looked_up')
        setSaved(true)
      }
    } catch {
      // silencioso — o usuário pode tentar de novo
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Bolinha flutuante */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Translator"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 900,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: open ? 'var(--ink)' : 'var(--clay)',
          color: '#fff',
          fontSize: '1.3rem',
          boxShadow: '0 8px 24px rgba(200,111,74,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? '✕' : '🌐'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              right: 20,
              bottom: 84,
              zIndex: 900,
              width: 300,
              maxWidth: 'calc(100vw - 40px)',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 18,
              boxShadow: 'var(--shadow-lg)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--ink)' }}>Translate</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)' }}>
                EN → {getNativeLangName()}
              </span>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a word, or select text on screen…"
              rows={2}
              autoFocus
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: 12,
                border: '1.5px solid var(--line)',
                background: '#fff',
                padding: '10px 12px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                marginBottom: 10,
              }}
            />

            <div style={{ minHeight: 44, borderRadius: 12, background: 'var(--sage)', padding: '10px 12px', marginBottom: 10 }}>
              {loading ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--moss)' }}><span className="spinner" /> …</span>
              ) : translation ? (
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--moss)' }}>{translation}</span>
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Translation appears here.</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={speak}
                disabled={!input.trim()}
                title="Listen"
                style={{ flex: '0 0 auto', width: 40, height: 38, borderRadius: 10, border: '1.5px solid var(--line)', background: '#fff', cursor: 'pointer', fontSize: '1rem', opacity: input.trim() ? 1 : 0.4 }}
              >
                🔊
              </button>
              <button
                onClick={save}
                disabled={!input.trim() || saving || saved}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  border: 'none',
                  cursor: input.trim() && !saved ? 'pointer' : 'default',
                  background: saved ? 'var(--moss)' : 'var(--clay)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  opacity: input.trim() ? 1 : 0.5,
                }}
              >
                {saved ? 'Saved ✓' : saving ? <><span className="spinner" /> Saving…</> : '+ Save to library'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
