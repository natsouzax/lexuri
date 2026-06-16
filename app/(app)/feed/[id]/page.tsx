'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import { getFeedItem, getYouTubeUrl, getLevelColor } from '@/lib/feed'
import { saveItem, unsaveItem, isItemSaved } from '@/lib/storage/local'
import { chunkToFlashcard } from '@/lib/types'
import type { ChunkAnalysis, ChunkItem, Flashcard, VideoData } from '@/lib/types'

const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function FeedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const item = getFeedItem(id)

  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)
  const [saved, setSaved]                     = useState(false)
  const [videoData, setVideoData]             = useState<VideoData | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState('')

  const [selectedWords, setSelectedWords]     = useState<string[]>([])
  const [generatedCards, setGeneratedCards]   = useState<Flashcard[]>([])
  const [generatingCards, setGeneratingCards] = useState(false)

  const [level, setLevel]                     = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis]     = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing]             = useState(false)
  const [selectedChunk, setSelectedChunk]     = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks]         = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [error, setError]                     = useState('')

  useEffect(() => { setSaved(isItemSaved(id)) }, [id])

  useEffect(() => {
    if (!localStorage.getItem('lexuri_welcome_dismissed')) {
      setShowWelcomeBanner(true)
    }
  }, [])

  // Auto-load transcript when the page opens
  const loadTranscript = useCallback(async () => {
    if (!item) return
    setTranscriptLoading(true)
    setTranscriptError('')
    try {
      const data = await apiFetch<VideoData>('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: getYouTubeUrl(item.youtube_id) }),
      })
      setVideoData(data)
    } catch (e) {
      setTranscriptError(String(e))
    } finally {
      setTranscriptLoading(false)
    }
  }, [item])

  useEffect(() => { loadTranscript() }, [loadTranscript])

  useEffect(() => {
    if (!videoData) return
    handleAnalyzeChunks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoData])

  function handleToggleSave() {
    if (saved) { unsaveItem(id); setSaved(false) }
    else       { saveItem(id);   setSaved(true)  }
  }

  async function handleGenerateFlashcards() {
    if (!selectedWords.length || !videoData) return
    setGeneratingCards(true)
    setError('')
    try {
      const timestamps: Record<string, number | null> = {}
      for (const word of selectedWords) {
        const seg = videoData.segments.find((s) =>
          (s.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).some((w) => w.toLowerCase() === word),
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
        setSelectedWords([])
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
    setError('')
    try {
      const card = chunkToFlashcard(chunk, chunkAnalysis.original_text)
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSavedChunks((prev) => new Set(prev).add(chunk.text))
      setGeneratedCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)])
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  if (!item) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">Item not found.</div>
        <Link href="/feed" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>← Back to Feed</Link>
      </div>
    )
  }

  const levelColor = getLevelColor(item.level)
  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      {showWelcomeBanner && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(70,98,74,0.12) 0%, rgba(70,98,74,0.06) 100%)',
            border: '1px solid rgba(70,98,74,0.3)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: '0.88rem', color: 'var(--moss)', fontWeight: 600 }}>
            Welcome. Start by revealing the AI chunk map, then save three useful expressions.
          </span>
          <button
            onClick={() => {
              localStorage.setItem('lexuri_welcome_dismissed', 'true')
              setShowWelcomeBanner(false)
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '1.1rem',
              lineHeight: 1,
              padding: '0 4px',
              flexShrink: 0,
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}
      <Hero
        title={item.title}
        subtitle={item.channel ?? item.artist ?? ''}
        body={item.preview}
      />

      {/* Back + meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/feed" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>
          Back to Feed
        </Link>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '2px 10px', borderRadius: 999, background: levelColor, color: '#fff' }}>
          {item.level}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{item.duration}</span>
        {item.tags.map((tag) => (
          <span key={tag} style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}>
            {tag}
          </span>
        ))}
        <button
          onClick={handleToggleSave}
          style={{
            marginLeft: 'auto',
            border: `1.5px solid ${saved ? 'var(--clay)' : 'var(--line)'}`,
            borderRadius: 999,
            padding: '6px 16px',
            background: saved ? 'rgba(200,111,74,0.1)' : '#fff',
            color: saved ? 'var(--clay)' : 'var(--muted)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Loading / error state */}
      {transcriptLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: 'var(--muted)' }}>
          <span className="spinner" />
          <span>Loading video and transcript...</span>
        </div>
      )}

      {transcriptError && (
        <div>
          <div className="alert-error">{transcriptError}</div>
          <button className="btn-secondary" onClick={loadTranscript} style={{ marginTop: 8 }}>Retry</button>
        </div>
      )}

      {/* Full studio experience (mirrors YouTube Studio, pre-loaded) */}
      {videoData && (
        <>
          <div className="section-title">Lesson Workspace</div>

          {/* Controls row */}
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 6 }}>
                {videoData.title}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: 0 }}>
                Play the video, read the transcript, then let AI surface the expressions worth saving. Focus on chunks you would actually use.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
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
              <button className="btn-primary btn-wide" onClick={handleAnalyzeChunks} disabled={analyzing}>
                {analyzing ? <><span className="spinner" />Finding essential chunks...</> : 'Reveal AI chunk map'}
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
            chunks={chunkAnalysis?.chunks}
            selectedChunk={selectedChunk}
            onChunkSelect={setSelectedChunk}
          />

          {/* Word collector */}
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
                {generatingCards ? <><span className="spinner" />Generating flashcards...</> : 'Generate flashcards'}
              </button>
            </>
          )}

          {error && <div className="alert-error">{error}</div>}

          {/* Generated word flashcards */}
          {generatedCards.length > 0 && (
            <>
              <div className="section-title">
                Generated Flashcards
                <Link href="/review" style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: 'var(--moss)', textDecoration: 'none' }}>
                  Go to Review
                </Link>
              </div>
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
                  Lexuri found {chunkAnalysis.chunks.length} natural expressions. Save the high-importance chunks first; those are the expressions most likely to improve real comprehension.
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
                  { type: 'phrasal_verb',    label: 'Phrasal Verb',    color: '#4CAF50' },
                  { type: 'idiomatic',       label: 'Idiom',           color: '#FF6B6B' },
                  { type: 'collocation',     label: 'Collocation',     color: '#4A90E2' },
                  { type: 'lexical_chunk',   label: 'Lexical Chunk',   color: '#9C27B0' },
                  { type: 'formulaic',       label: 'Formulaic',       color: '#FF9800' },
                  { type: 'grammar_pattern', label: 'Grammar Pattern', color: '#00BCD4' },
                  { type: 'emotional',       label: 'Emotional',       color: '#E91E63' },
                  { type: 'conversational',  label: 'Conversational',  color: '#607D8B' },
                ]
                  .filter(({ type }) => chunkAnalysis.chunks.some((c) => c.type === type))
                  .map(({ label, color }) => (
                    <span key={label} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '22', color }}>
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
    </>
  )
}
