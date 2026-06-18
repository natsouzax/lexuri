'use client'

import { useCallback, useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import MetricCard from '@/components/ui/MetricCard'
import DeckCard from '@/components/ui/DeckCard'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import { contentTabs } from '@/lib/product'
import type { ChunkAnalysis, ChunkItem, Flashcard, VideoData } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import type { SRSCard } from '@/lib/srs'

const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

function awardXP(event: string) {
  fetch('/api/gamification/award-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {})
}

export default function YouTubePage() {
  const [url, setUrl] = useState('')
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([])
  const [generatingCards, setGeneratingCards] = useState(false)

  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)

  const [allCards, setAllCards] = useState<Flashcard[]>([])
  const [dueCards, setDueCards] = useState<SRSCard[]>([])
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    try {
      const cards = await apiFetch<Flashcard[]>('/api/flashcards')
      setAllCards(cards)
      const { getDueCards } = await import('@/lib/srs')
      setDueCards(getDueCards(cards))
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  // Auto-analyze chunks as soon as a video is loaded, and re-run when level changes
  useEffect(() => {
    if (!videoData) return
    handleAnalyzeChunks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoData, level])

  async function handleLoadVideo() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setVideoData(null)
    setSelectedWords([])
    setGeneratedCards([])
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
    try {
      const data = await apiFetch<VideoData>('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      setVideoData(data)
      awardXP('video_studied')
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

  async function handleAnalyzeChunks() {
    if (!videoData) return
    setAnalyzing(true)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setError('')
    try {
      const result = await apiFetch<ChunkAnalysis>('/api/llm/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: videoData.transcript, level }),
      })
      setChunkAnalysis(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleMakeFlashcard(chunk: ChunkItem) {
    if (!chunkAnalysis) return
    setMakingFlashcard(chunk.text)
    try {
      const card = chunkToFlashcard(chunk, chunkAnalysis.original_text)
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSavedChunks((prev) => new Set(prev).add(chunk.text))
      awardXP('chunk_saved')
      await loadCards()
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
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

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      <Hero
        title="Learn"
        subtitle="YouTube workspace."
        body="Paste a video URL, import the transcript, watch in context, save useful chunks, generate cards, and schedule review without leaving the page."
      />

      <div className="learn-tabs">
        {contentTabs.map((tab) => (
          <a key={tab.href} href={tab.href} className={`learn-tab${tab.href === '/youtube' ? ' active' : ''}`}>
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </a>
        ))}
      </div>

      {/* Metrics */}
      <div className="metrics-row">
        <MetricCard label="Selected words" value={selectedWords.length} />
        <MetricCard label="Saved cards" value={allCards.length} />
        <MetricCard label="Due today" value={dueCards.length} />
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <span className="mini-label">First session mission</span>
        <div className="learning-loop" style={{ marginTop: 8 }}>
          <span>Paste video</span>
          <span>AI maps chunks</span>
          <span>Save 3 chunks</span>
          <span>Review today</span>
        </div>
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
                Play the video, read the transcript, then let AI surface the expressions worth saving. Focus on chunks you would actually use.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>My level:</span>
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: `1.5px solid ${level === l ? 'var(--clay)' : 'var(--line)'}`,
                      background: level === l ? 'var(--clay)' : 'transparent',
                      color: level === l ? '#fff' : 'var(--muted)',
                      fontWeight: level === l ? 700 : 400,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {analyzing && (
                <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" />Finding essential chunks…
                </div>
              )}
            </div>
          </div>

          {/* Synced player */}
          <div className="section-title">Synced Video Transcript</div>
          <YoutubeSyncPlayer
            videoId={videoData.video_id}
            segments={videoData.segments}
            selectedWords={selectedWords}
            onWordsChange={setSelectedWords}
            chunks={chunkAnalysis?.chunks}
            selectedChunk={selectedChunk}
            onChunkSelect={setSelectedChunk}
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

          {/* Generated word cards */}
          {generatedCards.length > 0 && (
            <>
              <div className="section-title">Generated Flashcards</div>
              {generatedCards.map((card) => (
                <GeneratedLearningCard key={card.id} card={card} />
              ))}
            </>
          )}

          {/* Chunk analysis */}
          {chunkAnalysis && (
            <>
              <div className="panel" style={{ marginBottom: 16 }}>
                <span className="mini-label">AI chunk map ready</span>
                <p className="panel-copy">
                  Lexuri found {chunkAnalysis.chunks.length} natural expressions. Start with the high-importance chunks, play the audio, and save the ones you want to remember.
                </p>
              </div>
              <div className="section-title">Chunk Map</div>
              <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
                <ChunkHighlighter
                  text={chunkAnalysis.original_text}
                  chunks={chunkAnalysis.chunks}
                  selectedChunk={selectedChunk}
                  onChunkClick={setSelectedChunk}
                />
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {[
                  { type: 'phrasal_verb', label: 'Phrasal Verb', color: '#4CAF50' },
                  { type: 'idiomatic', label: 'Idiom', color: '#FF6B6B' },
                  { type: 'collocation', label: 'Collocation', color: '#4A90E2' },
                  { type: 'lexical_chunk', label: 'Lexical Chunk', color: '#9C27B0' },
                  { type: 'formulaic', label: 'Formulaic', color: '#FF9800' },
                  { type: 'grammar_pattern', label: 'Grammar Pattern', color: '#00BCD4' },
                  { type: 'emotional', label: 'Emotional', color: '#E91E63' },
                  { type: 'conversational', label: 'Conversational', color: '#607D8B' },
                ]
                  .filter(({ type }) => chunkAnalysis.chunks.some((c) => c.type === type))
                  .map(({ label, color }) => (
                    <span
                      key={label}
                      style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '22', color }}
                    >
                      {label}
                    </span>
                  ))}
              </div>

              {highChunks.length > 0 && (
                <>
                  <div className="section-title">Key Expressions</div>
                  <div className="three-col" style={{ marginBottom: 24 }}>
                    {highChunks.map((chunk) => (
                      <ChunkCard
                        key={chunk.text + chunk.start}
                        chunk={chunk}
                        isSelected={selectedChunk?.text === chunk.text}
                        onSelect={setSelectedChunk}
                        onMakeFlashcard={handleMakeFlashcard}
                        making={makingFlashcard === chunk.text}
                        saved={savedChunks.has(chunk.text)}
                      />
                    ))}
                  </div>
                </>
              )}

              {otherChunks.length > 0 && (
                <>
                  <div className="section-title">More Chunks</div>
                  <div className="three-col">
                    {otherChunks.map((chunk) => (
                      <ChunkCard
                        key={chunk.text + chunk.start}
                        chunk={chunk}
                        isSelected={selectedChunk?.text === chunk.text}
                        onSelect={setSelectedChunk}
                        onMakeFlashcard={handleMakeFlashcard}
                        making={makingFlashcard === chunk.text}
                        saved={savedChunks.has(chunk.text)}
                      />
                    ))}
                  </div>
                </>
              )}
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
