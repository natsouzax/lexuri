'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import type { Flashcard } from '@/lib/types'
import type { SRSCard } from '@/lib/srs'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLearningLevel(card: Flashcard): { label: string; color: string; bg: string } {
  const { repetitions, interval } = card
  if (repetitions === 0) return { label: 'New',      color: '#4A90E2', bg: 'rgba(74,144,226,0.12)' }
  if (interval < 7)      return { label: 'Learning', color: '#FF9800', bg: 'rgba(255,152,0,0.12)'  }
  if (interval < 21)     return { label: 'Familiar', color: '#9C27B0', bg: 'rgba(156,39,176,0.12)' }
  if (interval < 90)     return { label: 'Review',   color: '#4CAF50', bg: 'rgba(76,175,80,0.12)'  }
  return                          { label: 'Mature',  color: '#46624a', bg: 'rgba(70,98,74,0.15)'   }
}

function formatNextReview(nextReview: string): string {
  const days = Math.ceil((new Date(nextReview).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'Due now'
  if (days === 1) return 'Tomorrow'
  return `In ${days} day${days === 1 ? '' : 's'}`
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionResult = { cardId: string; quality: number; word: string }
type Tab = 'review' | 'words'

// ── Review card ───────────────────────────────────────────────────────────────

interface ReviewCardProps {
  card: SRSCard
  index: number
  total: number
  onRate: (quality: number) => void
  submitting: boolean
}

function ReviewCard({ card, index, total, onRate, submitting }: ReviewCardProps) {
  const [revealed, setRevealed] = useState(false)

  // reset flip when the card changes
  useEffect(() => { setRevealed(false) }, [card.id])

  function playAudio() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(card.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.86
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div>
      <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span className="mini-label">Card {index + 1} of {total}</span>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.84rem' }}>+10 XP for a good recall response</p>
        </div>
        <button type="button" className="btn-secondary" onClick={playAudio}>Play Audio</button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 99 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              background: 'var(--clay)',
              width: `${((index + 1) / total) * 100}%`,
              transition: 'width 300ms ease',
            }}
          />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Flip card */}
      <div className="flashcard-scene" style={{ minHeight: 220, marginBottom: 20, cursor: revealed ? 'default' : 'pointer' }} onClick={() => !revealed && setRevealed(true)}>
        <div className={`flashcard-inner${revealed ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div className="flashcard-word">{card.word}</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 'auto', textAlign: 'center' }}>
              Tap to reveal answer
            </p>
          </div>
          {/* Back */}
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-word">{card.word}</div>
            {card.translation && (
              <p className="flashcard-translation">{card.translation}</p>
            )}
            <p className="flashcard-explanation">{card.definition}</p>
            {card.example && (
              <p className="flashcard-example">&ldquo;{card.example}&rdquo;</p>
            )}
          </div>
        </div>
      </div>

      {/* Before reveal: quick "I knew it" shortcut */}
      {!revealed && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary btn-wide"
            onClick={() => setRevealed(true)}
            disabled={submitting}
          >
            Show answer
          </button>
          <button
            className="btn-primary"
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => onRate(5)}
            disabled={submitting}
            title="I remembered perfectly — no need to flip"
          >
            {submitting ? <span className="spinner" /> : 'I knew it ★'}
          </button>
        </div>
      )}

      {/* After reveal: rate recall */}
      {revealed && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Again',    n: 0, note: 'forgot',      bg: 'rgba(192,57,43,0.1)',   color: '#c0392b', border: 'rgba(192,57,43,0.35)' },
            { label: 'Hard',     n: 1, note: 'needed hint', bg: 'rgba(200,111,74,0.1)',  color: '#c86f4a', border: 'rgba(200,111,74,0.35)' },
            { label: 'Good',     n: 3, note: 'remembered',  bg: 'rgba(39,174,96,0.1)',   color: '#27ae60', border: 'rgba(39,174,96,0.3)'   },
            { label: 'Easy',     n: 5, note: 'perfect',     bg: 'rgba(17,122,101,0.12)', color: '#117a65', border: 'rgba(17,122,101,0.3)'  },
          ].map(({ label, n, note, bg, color, border }) => (
            <button
              key={n}
              className="review-btn"
              onClick={() => onRate(n)}
              disabled={submitting}
              style={{ background: bg, color, borderColor: border, flex: 1 }}
            >
              {submitting
                ? <span className="spinner" style={{ width: 14, height: 14 }} />
                : <>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{label}</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>{note}</span>
                  </>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vocabulary list ───────────────────────────────────────────────────────────

function WordsTab({ cards }: { cards: Flashcard[] }) {
  if (cards.length === 0) {
    return (
      <div className="alert-info" style={{ marginTop: 16 }}>
        No saved cards yet.{' '}
        <Link href="/feed" style={{ color: 'var(--moss)', fontWeight: 700 }}>Browse the feed</Link>{' '}
        to create your first flashcard.
      </div>
    )
  }

  const sorted = [...cards].sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      {sorted.map((card) => {
        const lvl = getLearningLevel(card)
        const daysNext = formatNextReview(card.next_review)
        const isDue = new Date(card.next_review) <= new Date()

        return (
          <div
            key={card.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 14,
              border: `1px solid ${isDue ? 'rgba(200,111,74,0.4)' : 'var(--line)'}`,
              background: isDue ? 'rgba(200,111,74,0.04)' : '#fff',
            }}
          >
            {/* Word + translation */}
            <div>
              <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem' }}>
                {card.word}
              </span>
              {card.translation && (
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', marginLeft: 8 }}>
                  {card.translation}
                </span>
              )}
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                {card.explanation.length > 80 ? card.explanation.slice(0, 80) + '…' : card.explanation}
              </div>
            </div>

            {/* Learning level badge */}
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 900,
                padding: '3px 10px',
                borderRadius: 999,
                background: lvl.bg,
                color: lvl.color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}
            >
              {lvl.label}
            </span>

            {/* Next review */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isDue ? 'var(--clay)' : 'var(--muted)',
                whiteSpace: 'nowrap',
                minWidth: 90,
                textAlign: 'right',
              }}
            >
              {isDue ? '● Due now' : daysNext}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [allCards, setAllCards]   = useState<Flashcard[]>([])
  const [dueCards, setDueCards]   = useState<SRSCard[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [tab, setTab]             = useState<Tab>('review')

  const [queueIndex, setQueueIndex]       = useState(0)
  const [submitting, setSubmitting]       = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([])
  const [sessionDone, setSessionDone]     = useState(false)

  const loadCards = useCallback(async () => {
    setLoading(true)
    try {
      const cards = await apiFetch<Flashcard[]>('/api/flashcards')
      setAllCards(cards)
      const { getDueCards } = await import('@/lib/srs')
      setDueCards(getDueCards(cards))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  async function handleRate(quality: number) {
    const card = dueCards[queueIndex]
    if (!card) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/flashcards/${card.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      })
      setSessionResults((prev) => [...prev, { cardId: card.id, quality, word: card.word }])

      if (queueIndex + 1 >= dueCards.length) {
        // finished the queue — reload so "My Words" reflects updated schedules
        await loadCards()
        setSessionDone(true)
      } else {
        setQueueIndex((i) => i + 1)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  function handleRestart() {
    setSessionDone(false)
    setSessionResults([])
    setQueueIndex(0)
    loadCards()
  }

  const reviewed = sessionResults.length
  const correct  = sessionResults.filter((r) => r.quality >= 3).length

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <span className="spinner" />
        <span style={{ marginLeft: 8, color: 'var(--muted)' }}>Loading your cards…</span>
      </div>
    )
  }

  return (
    <>
      <Hero
        title="Review"
        subtitle="Recall, listen, rate, repeat."
        body="Move through your due cards with a modern SRS flow. Reveal meaning, hear pronunciation, check context, then choose Again, Hard, Good, or Easy."
      />

      {/* Metrics */}
      <div className="metrics-row">
        <MetricCard label="Total cards" value={allCards.length} />
        <MetricCard label="Due today"   value={dueCards.length} />
        <MetricCard label="Reviewed"    value={reviewed} />
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginTop: 24, marginBottom: 20, borderBottom: '2px solid var(--line)', paddingBottom: 0 }}>
        {(['review', 'words'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: 'none',
              background: 'none',
              padding: '8px 18px',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 900,
              fontSize: '0.82rem',
              cursor: 'pointer',
              color: tab === t ? 'var(--clay)' : 'var(--muted)',
              borderBottom: tab === t ? '2px solid var(--clay)' : '2px solid transparent',
              marginBottom: -2,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: 'color 120ms ease',
            }}
          >
            {t === 'review' ? `Review${dueCards.length > 0 ? ` (${dueCards.length})` : ''}` : 'My Words'}
          </button>
        ))}
      </div>

      {/* ── Review tab ── */}
      {tab === 'review' && (
        <>
          {sessionDone ? (
            /* Session complete */
            <div>
              <div className="alert-info" style={{ marginBottom: 16 }}>
                Session complete — {reviewed} card{reviewed !== 1 ? 's' : ''} reviewed, {correct} remembered.
              </div>

              <div className="section-title">Session Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {sessionResults.map((r) => (
                  <div
                    key={r.cardId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      background: '#fff',
                    }}
                  >
                    <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900 }}>{r.word}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: r.quality >= 3 ? 'rgba(70,98,74,0.12)' : 'rgba(200,80,60,0.1)',
                        color: r.quality >= 3 ? 'var(--moss)' : '#7a1a0e',
                      }}
                    >
                      {r.quality >= 3 ? 'Remembered' : 'Again'} · {r.quality}/5
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setTab('words')}>See My Words</button>
                <Link href="/feed" className="btn-primary">Back to Feed</Link>
                {dueCards.length > 0 && (
                  <button className="btn-secondary" onClick={handleRestart}>
                    Keep reviewing ({dueCards.length} left)
                  </button>
                )}
              </div>
            </div>
          ) : dueCards.length === 0 ? (
            /* Nothing due */
            <div>
              <div className="alert-info" style={{ marginBottom: 16 }}>
                All caught up — no cards due right now.{' '}
                <button
                  onClick={() => setTab('words')}
                  style={{ background: 'none', border: 'none', color: 'var(--moss)', fontWeight: 700, cursor: 'pointer', padding: 0, font: 'inherit', fontSize: '0.88rem' }}
                >
                  See My Words →
                </button>
              </div>
              <Link href="/feed" className="btn-primary">Add vocabulary from the feed</Link>
            </div>
          ) : (
            /* Active review */
            <ReviewCard
              card={dueCards[queueIndex]}
              index={queueIndex}
              total={dueCards.length}
              onRate={handleRate}
              submitting={submitting}
            />
          )}
        </>
      )}

      {/* ── My Words tab ── */}
      {tab === 'words' && <WordsTab cards={allCards} />}
    </>
  )
}
