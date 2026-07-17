'use client'

import { useCallback, useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import FlashcardView from '@/components/ui/FlashcardView'
import { getSavedItemIds } from '@/lib/storage/local'
import type { Flashcard } from '@/lib/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function FlashcardsPage() {
  const [word, setWord] = useState('')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [savedLessons, setSavedLessons] = useState(0)

  const loadCards = useCallback(async () => {
    try {
      const data = await apiFetch<Flashcard[]>('/api/flashcards')
      setCards(data)
      if (!currentCard && data.length) setCurrentCard(data[0])
    } catch {}
  }, [currentCard])

  useEffect(() => { loadCards() }, [loadCards])
  useEffect(() => { setSavedLessons(getSavedItemIds().length) }, [])

  async function handleGenerate() {
    if (!word.trim()) return
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const card = await apiFetch<Flashcard>('/api/llm/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() }),
      })
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSuccess('Flashcard saved.')
      setWord('')
      setCurrentCard(card)
      await loadCards()
    } catch (e) {
      setError(String(e))
    } finally {
      setGenerating(false)
    }
  }

  const dueCards = cards.filter((card) => new Date(card.next_review) <= new Date())
  const matureCards = cards.filter((card) => card.interval >= 21)

  return (
    <>
      <Hero
        title="Library"
        subtitle="Your saved English from real content."
        body="Use this page to browse saved chunks and flashcards. Practice happens in Review; new vocabulary should come from Feed, YouTube, or Music whenever possible."
      />

      <div className="home-grid" style={{ marginBottom: 8 }}>
        <div className="panel">
          <span className="mini-label">Saved chunks</span>
          <p className="rank-title">{cards.length}</p>
          <p className="panel-copy">Expressions converted into contextual memory cards.</p>
        </div>
        <div className="panel">
          <span className="mini-label">Saved lessons</span>
          <p className="rank-title">{savedLessons}</p>
          <p className="panel-copy">Videos, songs, and feed lessons in your queue.</p>
        </div>
        <div className="panel">
          <span className="mini-label">Mastery</span>
          <p className="rank-title">{matureCards.length}</p>
          <p className="panel-copy">Cards stable enough to be considered long-term memory.</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-info">{success}</div>}

      {cards.length > 0 && (
        <>
          <div className="section-title">Browse Library</div>
          <div className="panel">
            <div className="select-row">
              <span className="select-label">Card</span>
              <select
                className="select-field"
                value={currentCard?.id ?? ''}
                onChange={(e) => {
                  const found = cards.find((c) => c.id === e.target.value)
                  if (found) setCurrentCard(found)
                }}
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>{card.word}</option>
                ))}
              </select>
            </div>
            {currentCard && (
              <>
                <FlashcardView card={currentCard} flipped={flipped} />
                <button
                  className="btn-secondary btn-wide"
                  onClick={() => setFlipped((value) => !value)}
                  style={{ marginBottom: 18 }}
                >
                  {flipped ? 'Show front' : 'Flip card'}
                </button>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href="/review" className="btn-primary" style={{ textDecoration: 'none' }}>
                    Review {dueCards.length} due
                  </a>
                  <a href="/feed" className="btn-secondary" style={{ textDecoration: 'none' }}>
                    Add from real content
                  </a>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <details className="panel" style={{ marginTop: 24 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900 }}>Create a manual fallback card</summary>
        <p className="panel-copy" style={{ marginTop: 8, marginBottom: 14 }}>
          Use this only when an expression did not come from a lesson. Lexuri works best when each card keeps its original context.
        </p>
        <div className="input-row">
          <input
            className="input-field"
            placeholder="e.g. thoughtful"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <><span className="spinner" />Generating...</> : 'Generate'}
          </button>
        </div>
      </details>

      {!currentCard && !generating && cards.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px', marginTop: 24 }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 8 }}>
            Your library is empty.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 28, lineHeight: 1.6 }}>
            Start with a real video or song, let AI find useful chunks, then save the ones you want to remember.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/demo" className="btn-primary" style={{ textDecoration: 'none' }}>Try the demo lesson</a>
            <a href="/feed" className="btn-secondary" style={{ textDecoration: 'none' }}>Browse lessons</a>
          </div>
        </div>
      )}
    </>
  )
}
