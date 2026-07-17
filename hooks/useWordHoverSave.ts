'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeFlashcard } from '@/lib/types'
import type { Flashcard } from '@/lib/types'
import { awardXP } from '@/lib/xp'

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
// preview its translation, click it to save as a flashcard immediately
// (reusing whatever the hover already fetched). Used by every video/lyrics
// caption surface in the app (YoutubeSyncPlayer, SyncedLyricsList) so the
// touch/hover behavior is identical everywhere.
export function useWordHoverSave(resetKey: unknown, onWordSaved?: (card: Flashcard) => void) {
  const wordCacheRef = useRef(new Map<string, WordDef>())
  const [tooltip, setTooltip] = useState<WordTooltipState | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [savingWord, setSavingWord] = useState<string | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Reset per "surface" (e.g. a new video or a new song) so cached
  // translations/saved checkmarks don't leak across unrelated content.
  useEffect(() => {
    wordCacheRef.current = new Map()
    setSavedWords(new Set())
    setTooltip(null)
  }, [resetKey])

  const fetchWordDef = useCallback(async (word: string, context: string): Promise<WordDef> => {
    const cached = wordCacheRef.current.get(word)
    if (cached) return cached
    const def = await apiFetch<WordDef>('/api/llm/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context }),
    })
    wordCacheRef.current.set(word, def)
    return def
  }, [])

  const onHover = useCallback((word: string, context: string, rect: DOMRect) => {
    clearTimeout(hideTimerRef.current)
    clearTimeout(hoverTimerRef.current)
    if (savedWords.has(word)) return
    hoverTimerRef.current = setTimeout(async () => {
      const cached = wordCacheRef.current.get(word)
      setTooltip({ word, x: rect.left + rect.width / 2, y: rect.top, loading: !cached, def: cached })
      if (!cached) {
        try {
          const def = await fetchWordDef(word, context)
          setTooltip((t) => (t?.word === word ? { ...t, loading: false, def } : t))
        } catch {
          setTooltip((t) => (t?.word === word ? { ...t, loading: false, error: true } : t))
        }
      }
    }, HOVER_DELAY_MS)
  }, [savedWords, fetchWordDef])

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
      })
      if (card) {
        const [saved] = await apiFetch<Flashcard[]>('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: [card] }),
        })
        setSavedWords((prev) => new Set(prev).add(word))
        awardXP('word_looked_up')
        if (saved) onWordSaved?.(saved)
      }
    } catch {
      // leave the word clickable so the user can retry
    } finally {
      setSavingWord(null)
      setTooltip(null)
    }
  }, [savedWords, savingWord, fetchWordDef, onWordSaved])

  return { tooltip, savedWords, savingWord, onHover, onLeave, onWordClick, cancelHide, hideNow }
}
