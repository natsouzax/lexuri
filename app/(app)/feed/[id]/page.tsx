'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
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

  const [saved, setSaved] = useState(false)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState('')

  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)

  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [recentCards, setRecentCards] = useState<Flashcard[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    setSaved(isItemSaved(id))
  }, [id])

  const handleToggleSave = useCallback(() => {
    if (saved) {
      unsaveItem(id)
      setSaved(false)
    } else {
      saveItem(id)
      setSaved(true)
    }
  }, [id, saved])

  async function handleLoadTranscript() {
    if (!item) return
    setTranscriptLoading(true)
    setTranscriptError('')
    setVideoData(null)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
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
      setRecentCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)])
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
      <Hero
        title={item.title}
        subtitle={item.channel ?? item.artist ?? ''}
        body={item.preview}
      />

      {/* Back + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link
          href="/feed"
          style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}
        >
          ← Feed
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
          {saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>

      {/* Embedded YouTube player */}
      <div className="section-title">Video</div>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 16, overflow: 'hidden', marginBottom: 24, border: '1px solid var(--line)' }}>
        <iframe
          src={`https://www.youtube.com/embed/${item.youtube_id}`}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={item.title}
        />
      </div>

      {/* Load transcript */}
      <div className="section-title">Transcript & Analysis</div>
      {!videoData && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 12 }}>
            Load the transcript to extract vocabulary, analyze language chunks, and create flashcards.
          </p>
          <button className="btn-primary btn-wide" onClick={handleLoadTranscript} disabled={transcriptLoading}>
            {transcriptLoading ? <><span className="spinner" />Loading transcript…</> : 'Load transcript'}
          </button>
          {transcriptError && <div className="alert-error" style={{ marginTop: 12 }}>{transcriptError}</div>}
        </>
      )}

      {videoData && (
        <>
          {/* Transcript text */}
          <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Full Transcript
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--ink)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {videoData.transcript}
            </p>
          </div>

          {/* Level + analyze button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
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
            <button
              className="btn-primary"
              onClick={handleAnalyzeChunks}
              disabled={analyzing}
              style={{ marginLeft: 'auto' }}
            >
              {analyzing ? <><span className="spinner" />Analyzing…</> : 'Analyze language chunks'}
            </button>
          </div>

          {error && <div className="alert-error">{error}</div>}
        </>
      )}

      {/* Chunk map */}
      {chunkAnalysis && (
        <>
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
              <div className="three-col" style={{ marginBottom: 24 }}>
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

      {/* Recently created cards */}
      {recentCards.length > 0 && (
        <>
          <div className="section-title">Cards Created This Session</div>
          <div className="alert-info" style={{ marginBottom: 12 }}>
            {recentCards.length} card{recentCards.length !== 1 ? 's' : ''} saved.{' '}
            <Link href="/review" style={{ color: 'var(--moss)', fontWeight: 700 }}>Go to Review →</Link>
          </div>
          {recentCards.map((card) => (
            <GeneratedLearningCard key={card.id} card={card} />
          ))}
        </>
      )}
    </>
  )
}
