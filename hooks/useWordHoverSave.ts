'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeFlashcard } from '@/lib/types'
import { getNativeLangName } from '@/lib/i18n'
import type { Flashcard } from '@/lib/types'

export interface WordDef {
  word: string
  partOfSpeech: string
  definition: string
  example: string
  translation: string
}

export interface WordTooltipState {
  word: string
  x: number
  y: number
  loading: boolean
  def?: WordDef
  error?: boolean
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const HOVER_DELAY_MS = 80
const HIDE_DELAY_MS = 150

// Shared tap-to-translate + click-to-save interaction: hover a word to
// preview its translation, click it to save as a flashcard immediately.
// Hover uses /api/llm/translate (translation only, minimal tokens — as
// close to instant as an AI call can be); click uses /api/llm/define (full
// definition + example, needed for the flashcard) only when actually
// saving, so the hover itself never waits on the slower call.
export function useWordHoverSave(
  resetKey: unknown,
  onWordSaved?: (card: Flashcard) => void,
  sourceVideo?: string | null,
) {
  const translationCacheRef = useRef(new Map<string, string>())
  const defCacheRef = useRef(new Map<string, WordDef>())
  const [tooltip, setTooltip] = useState<WordTooltipState | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [savingWord, setSavingWord] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Reset per "surface" (e.g. a new video or a new song) so cached
  // translations/saved checkmarks don't leak across unrelated content.
  useEffect(() => {
    translationCacheRef.current = new Map()
    defCacheRef.current = new Map()
    setSavedWords(new Set())
    setTooltip(null)
  }, [resetKey])

  const fetchTranslation = useCallback(async (word: string, context: string): Promise<string> => {
    const cachedDef = defCacheRef.current.get(word)
    if (cachedDef) return cachedDef.translation
    const cached = translationCacheRef.current.get(word)
    if (cached) return cached
    const { translation } = await apiFetch<{ translation: string }>('/api/llm/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context, native_lang: getNativeLangName() }),
    })
    translationCacheRef.current.set(word, translation)
    return translation
  }, [])

  const fetchWordDef = useCallback(async (word: string, context: string): Promise<WordDef> => {
    const cached = defCacheRef.current.get(word)
    if (cached) return cached
    const def = await apiFetch<WordDef>('/api/llm/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context, native_lang: getNativeLangName() }),
    })
    defCacheRef.current.set(word, def)
    return def
  }, [])

  const onHover = useCallback((word: string, context: string, rect: DOMRect) => {
    clearTimeout(hideTimerRef.current)
    clearTimeout(hoverTimerRef.current)
    if (savedWords.has(word)) return
    hoverTimerRef.current = setTimeout(async () => {
      const cachedDef = defCacheRef.current.get(word)
      const cachedTranslation = cachedDef?.translation ?? translationCacheRef.current.get(word)
      setTooltip({
        word,
        x: rect.left + rect.width / 2,
        y: rect.top,
        loading: !cachedTranslation,
        def: cachedTranslation ? ({ translation: cachedTranslation } as WordDef) : undefined,
      })
      if (!cachedTranslation) {
        try {
          const translation = await fetchTranslation(word, context)
          setTooltip((t) => (t?.word === word ? { ...t, loading: false, def: { translation } as WordDef } : t))
        } catch {
          setTooltip((t) => (t?.word === word ? { ...t, loading: false, error: true } : t))
        }
      }
    }, HOVER_DELAY_MS)
  }, [savedWords, fetchTranslation])

  const onLeave = useCallback(() => {
    clearTimeout(hoverTimerRef.current)
    hideTimerRef.current = setTimeout(() => setTooltip(null), HIDE_DELAY_MS)
  }, [])

  const cancelHide = useCallback(() => clearTimeout(hideTimerRef.current), [])
  const hideNow = useCallback(() => setTooltip(null), [])

  const onWordClick = useCallback(async (word: string, context: string) => {
    if (savedWords.has(word) || savingWord === word) return
    setSavingWord(word)
    try {
      const def = await fetchWordDef(word, context)
      const card = normalizeFlashcard({
        word: def.word,
        translation: def.translation,
        explanation: `(${def.partOfSpeech}) ${def.definition}`,
        example: def.example,
      }, sourceVideo ?? null)
      if (card) {
        const [saved] = await apiFetch<Flashcard[]>('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: [card] }),
        })
        setSavedWords((prev) => new Set(prev).add(word))
        if (saved) onWordSaved?.(saved)
      }
    } catch {
      // leave the word clickable so the user can retry
    } finally {
      setSavingWord(null)
      setTooltip(null)
    }
  }, [savedWords, savingWord, fetchWordDef, onWordSaved, sourceVideo])

  return { tooltip, savedWords, savingWord, onHover, onLeave, onWordClick, cancelHide, hideNow }
}
