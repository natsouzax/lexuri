'use client'

import { useCallback, useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import FlashcardView from '@/components/ui/FlashcardView'
import type { Flashcard, QuizData } from '@/lib/types'

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

  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)

  const loadCards = useCallback(async () => {
    try {
      const data = await apiFetch<Flashcard[]>('/api/flashcards')
      setCards(data)
      if (!currentCard && data.length) setCurrentCard(data[0])
    } catch {
      /* silent */
    }
  }, [currentCard])

  useEffect(() => { loadCards() }, [loadCards])

  // Load quiz when current card changes
  useEffect(() => {
    if (!currentCard) return
    setQuiz(null)
    setQuizAnswer(null)
    setQuizResult(null)
    setFlipped(false)
    loadQuiz(currentCard)
  }, [currentCard?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadQuiz(card: Flashcard) {
    setQuizLoading(true)
    try {
      const q = await apiFetch<QuizData>('/api/llm/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: card.word, explanation: card.explanation }),
      })
      setQuiz(q)
    } catch {
      /* quiz is optional */
    } finally {
      setQuizLoading(false)
    }
  }

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

  function handleSubmitQuiz() {
    if (!quizAnswer || !quiz) return
    setQuizResult(quizAnswer === quiz.answer ? 'correct' : 'wrong')
  }

  return (
    <>
      <Hero
        title="Flashcards"
        subtitle="Build one sharp memory card at a time."
        body="Type a word, generate a compact explanation, flip for examples, and test yourself with a quick quiz."
      />

      {/* Create */}
      <div className="section-title">Create A Card</div>
      <div className="input-row">
        <input
          className="input-field"
          placeholder="e.g. thoughtful"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><span className="spinner" />Generating…</> : 'Generate'}
        </button>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-info">{success}</div>}

      {currentCard && (
        <>
          {/* Study card */}
          <div className="section-title">Study Card</div>
          <FlashcardView card={currentCard} flipped={flipped} />
          <button
            className="btn-secondary btn-wide"
            onClick={() => setFlipped((f) => !f)}
            style={{ marginBottom: 24 }}
          >
            {flipped ? 'Show front' : 'Flip card'}
          </button>

          {/* Saved cards selector */}
          {cards.length > 1 && (
            <>
              <div className="section-title">Saved Cards</div>
              <select
                className="select-field"
                value={currentCard.id}
                onChange={(e) => {
                  const found = cards.find((c) => c.id === e.target.value)
                  if (found) setCurrentCard(found)
                }}
                style={{ marginBottom: 24 }}
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>{c.word}</option>
                ))}
              </select>
            </>
          )}

          {/* Quiz */}
          <div className="section-title">Quick Quiz</div>
          {quizLoading && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}><span className="spinner" />Preparing question…</p>}
          {quiz && (
            <div className="card">
              <p style={{ fontWeight: 700, marginBottom: 14 }}>{quiz.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {quiz.options.map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      cursor: 'pointer',
                      background: quizAnswer === opt ? 'rgba(24,33,29,0.06)' : undefined,
                      fontWeight: quizAnswer === opt ? 700 : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      name="quiz"
                      value={opt}
                      checked={quizAnswer === opt}
                      onChange={() => setQuizAnswer(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {quizResult === null ? (
                <button className="btn-primary btn-wide" onClick={handleSubmitQuiz} disabled={!quizAnswer}>
                  Submit answer
                </button>
              ) : quizResult === 'correct' ? (
                <div className="alert-info">Correct. Nice recall.</div>
              ) : (
                <div className="alert-error">Not quite. Correct answer: {quiz.answer}</div>
              )}
            </div>
          )}
        </>
      )}

      {!currentCard && !generating && (
        <div className="alert-info">
          Start with a word you noticed today. Small cards compound quickly.
        </div>
      )}
    </>
  )
}
