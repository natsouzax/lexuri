'use client'

import { useCallback, useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import FlashcardView from '@/components/ui/FlashcardView'
import VocabCard from '@/components/ui/VocabCard'
import DeckCard from '@/components/ui/DeckCard'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import type { Flashcard, VideoData, VocabItem } from '@/lib/types'
import type { SRSCard } from '@/lib/srs'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function YouTubePage() {
  const [url, setUrl] = useState('')
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [generatingCards, setGeneratingCards] = useState(false)

  const [level, setLevel] = useState<string>('Intermediate')
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [extractingVocab, setExtractingVocab] = useState(false)
  const [vocabLoadingIdx, setVocabLoadingIdx] = useState<number | null>(null)

  const [allCards, setAllCards] = useState<Flashcard[]>([])
  const [dueCards, setDueCards] = useState<SRSCard[]>([])
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    try {
      const cards = await apiFetch<Flashcard[]>('/api/flashcards')
      setAllCards(cards)
      const now = new Date()
      const { getDueCards } = await import('@/lib/srs')
      setDueCards(getDueCards(cards))
      void now
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  async function handleLoadVideo() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setVideoData(null)
    setSelectedWords([])
    setGeneratedCards([])
    setVocab([])
    try {
      const data = await apiFetch<VideoData>('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      setVideoData(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateFlashcards() {
    if (!selectedWords.length || !videoData) return
    setGeneratingCards(true)
    try {
      const timestamps: Record<string, number | null> = {}
      for (const word of selectedWords) {
        const seg = videoData.segments.find((s) =>
          (s.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).some(
            (w) => w.toLowerCase() === word,
          ),
        )
        timestamps[word] = seg?.start ?? null
      }

      const cards = await apiFetch<Flashcard[]>('/api/llm/flashcards-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, source_video: videoData.video_id, timestamps }),
      })

      const valid = cards.filter((c) => !('error' in c))
      if (valid.length) {
        await apiFetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: valid }),
        })
        setGeneratedCards(valid)
        await loadCards()
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setGeneratingCards(false)
    }
  }

  async function handleExtractVocab() {
    if (!videoData) return
    setExtractingVocab(true)
    try {
      const items = await apiFetch<VocabItem[]>('/api/llm/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: videoData.transcript, level }),
      })
      setVocab(items)
    } catch (e) {
      setError(String(e))
    } finally {
      setExtractingVocab(false)
    }
  }

  async function handleVocabFlashcard(item: VocabItem, idx: number) {
    setVocabLoadingIdx(idx)
    try {
      const card = await apiFetch<Flashcard>('/api/llm/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: item.word }),
      })
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      await loadCards()
    } catch (e) {
      setError(String(e))
    } finally {
      setVocabLoadingIdx(null)
    }
  }

  async function handleReview(cardId: string, quality: number) {
    setReviewingId(cardId)
    try {
      await apiFetch(`/api/flashcards/${cardId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality }),
      })
      await loadCards()
    } catch (e) {
      setError(String(e))
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <>
      <Hero
        title="YouTube Studio"
        subtitle="Turn any video into a focused English lesson."
        body="Paste a YouTube link, click words in the transcript, and turn them into flashcards."
      />

      {/* Metrics */}
      <div className="metrics-row">
        <MetricCard label="Selected words" value={selectedWords.length} />
        <MetricCard label="Saved cards" value={allCards.length} />
        <MetricCard label="Due today" value={dueCards.length} />
      </div>

      {/* Load video */}
      <div className="section-title">Load A Video</div>
      <div className="input-row">
        <input
          className="input-field"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
        />
        <button className="btn-primary" onClick={handleLoadVideo} disabled={loading}>
          {loading ? <><span className="spinner" />Loading…</> : 'Load video'}
        </button>
      </div>
      {error && <div className="alert-error">{error}</div>}

      {videoData && (
        <>
          <div className="section-title">Lesson Workspace</div>

          {/* Controls */}
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.2rem', marginBottom: 8 }}>
                {videoData.title}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
                Play the video below. The transcript syncs and highlights the current word.
              </p>
            </div>
            <div>
              <div className="select-row">
                <span className="select-label">Level</span>
                <select className="select-field" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <button className="btn-primary btn-wide" onClick={handleExtractVocab} disabled={extractingVocab}>
                {extractingVocab ? <><span className="spinner" />Analyzing…</> : 'Extract AI vocabulary'}
              </button>
            </div>
          </div>

          {/* Synced player */}
          <div className="section-title">Synced Video Transcript</div>
          <YoutubeSyncPlayer
            videoId={videoData.video_id}
            segments={videoData.segments}
            selectedWords={selectedWords}
            onWordsChange={setSelectedWords}
          />

          {/* Word collector actions */}
          {selectedWords.length > 0 && (
            <>
              <div className="section-title">Vocabulary Collector</div>
              <div className="chip-list">
                {selectedWords.map((word) => (
                  <button
                    key={word}
                    className="chip"
                    onClick={() => setSelectedWords((prev) => prev.filter((w) => w !== word))}
                  >
                    {word} ×
                  </button>
                ))}
              </div>
              <button
                className="btn-primary btn-wide"
                onClick={handleGenerateFlashcards}
                disabled={generatingCards}
              >
                {generatingCards ? <><span className="spinner" />Generating flashcards…</> : 'Generate Flashcards'}
              </button>
            </>
          )}

          {/* Generated cards */}
          {generatedCards.length > 0 && (
            <>
              <div className="section-title">Generated Flashcards</div>
              {generatedCards.map((card) => (
                <GeneratedLearningCard key={card.id} card={card} />
              ))}
            </>
          )}

          {/* Vocab picks */}
          {vocab.length > 0 && (
            <>
              <div className="section-title">AI Vocabulary Picks</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 12 }}>
                Each word includes context from the video and a reason why it matters.
              </p>
              {vocab.map((item, idx) => (
                <VocabCard
                  key={`${item.word}-${idx}`}
                  item={item}
                  onGenerateFlashcard={() => handleVocabFlashcard(item, idx)}
                  loading={vocabLoadingIdx === idx}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* SRS Review deck */}
      <div className="section-title">Today&apos;s Review</div>
      {dueCards.length === 0 ? (
        <div className="alert-info">
          No cards to review today. Add vocabulary from a video to start building your deck.
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            Rate recall from 0 to 5. Higher scores schedule the card further into the future.
          </p>
          {dueCards.map((card) => (
            <DeckCard
              key={card.id}
              card={card}
              onReview={(q) => handleReview(card.id, q)}
              reviewing={reviewingId === card.id}
            />
          ))}
        </>
      )}
    </>
  )
}
