'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import type { ChunkAnalysis, ChunkItem, Flashcard, Song } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import { parseLrc } from '@/lib/lyrics'
import type { LrcLine } from '@/lib/lyrics'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVEL_OPTIONS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVEL_OPTIONS)[number]

const CHUNK_LEGEND = [
  { type: 'phrasal_verb', label: 'Phrasal Verb', color: '#4CAF50' },
  { type: 'idiomatic', label: 'Idiom', color: '#FF6B6B' },
  { type: 'collocation', label: 'Collocation', color: '#4A90E2' },
  { type: 'lexical_chunk', label: 'Lexical Chunk', color: '#9C27B0' },
  { type: 'formulaic', label: 'Formulaic', color: '#FF9800' },
  { type: 'grammar_pattern', label: 'Grammar Pattern', color: '#00BCD4' },
  { type: 'emotional', label: 'Emotional', color: '#E91E63' },
  { type: 'conversational', label: 'Conversational', color: '#607D8B' },
] as const

export default function SongPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Lyrics display
  const [lrcLines, setLrcLines] = useState<LrcLine[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  // Analysis
  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    apiFetch<Song>(`/api/music/songs/${id}`)
      .then((s) => {
        setSong(s)
        if (s.lrc_content) setLrcLines(parseLrc(s.lrc_content))
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAnalyze() {
    if (!song?.plain_lyrics) return
    setAnalyzing(true)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
    setAnalysisError('')
    try {
      const result = await apiFetch<ChunkAnalysis>('/api/llm/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: song.plain_lyrics, level }),
      })
      setChunkAnalysis(result)
      // Update chunks_count in DB
      await apiFetch(`/api/music/songs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks_count: result.chunks.length }),
      })
    } catch (e) {
      setAnalysisError(String(e))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleMakeFlashcard(chunk: ChunkItem) {
    if (!chunkAnalysis) return
    setMakingFlashcard(chunk.text)
    try {
      const card: Flashcard = chunkToFlashcard(chunk, chunkAnalysis.original_text)
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSavedChunks((prev) => new Set(prev).add(chunk.text))
    } catch (e) {
      setAnalysisError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
        <span className="spinner" style={{ display: 'inline-block', marginRight: 8 }} />
        Loading song…
      </div>
    )
  }

  if (error || !song) {
    return (
      <div>
        <div className="alert-error">{error || 'Song not found.'}</div>
        <Link href="/music" style={{ color: 'var(--moss)', fontWeight: 700 }}>← Back to Music Lab</Link>
      </div>
    )
  }

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []
  const hasLrc = lrcLines.length > 0

  return (
    <>
      {/* Back link */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/music" style={{ fontSize: '0.83rem', color: 'var(--muted)', fontWeight: 700, textDecoration: 'none' }}>
          ← Music Lab
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '2rem', lineHeight: 1.1, marginBottom: 6 }}>
          {song.title}
        </h1>
        <div style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 700 }}>{song.artist}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {song.lrc_content && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)' }}>
              ✓ Synced lyrics
            </span>
          )}
          {song.chunks_count > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(72,144,226,0.12)', color: '#4A90E2' }}>
              {song.chunks_count} chunks found
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', padding: '2px 0' }}>
            Added {new Date(song.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Lyrics */}
      <div className="section-title">Lyrics</div>
      <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
        {hasLrc ? (
          <div style={{ lineHeight: 2.2 }}>
            {lrcLines.map((line, i) => (
              <div
                key={i}
                onClick={() => setActiveLine(activeLine === i ? null : i)}
                style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: activeLine === i ? 'rgba(200,111,74,0.12)' : 'transparent',
                  borderLeft: activeLine === i ? '3px solid var(--clay)' : '3px solid transparent',
                  transition: 'all 120ms ease',
                  fontSize: '0.93rem',
                  fontWeight: activeLine === i ? 700 : 400,
                  color: activeLine === i ? 'var(--ink)' : 'var(--muted)',
                }}
              >
                <span style={{ fontSize: '0.65rem', opacity: 0.5, marginRight: 10, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(line.time)}
                </span>
                {line.text || <span style={{ opacity: 0.3 }}>♩</span>}
              </div>
            ))}
          </div>
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.93rem', lineHeight: 2, margin: 0, color: 'var(--ink)' }}>
            {song.plain_lyrics || <span style={{ color: 'var(--muted)' }}>No lyrics available.</span>}
          </pre>
        )}
      </div>

      {/* Analyze */}
      {song.plain_lyrics && (
        <>
          <div className="section-title">Language Analysis</div>
          <div className="input-row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>My level:</span>
              {LEVEL_OPTIONS.map((l) => (
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
            <button className="btn-primary btn-wide" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <><span className="spinner" />Analyzing…</> : chunkAnalysis ? 'Re-analyze' : 'Analyze language chunks'}
            </button>
          </div>
        </>
      )}

      {analysisError && <div className="alert-error">{analysisError}</div>}

      {chunkAnalysis && (
        <>
          <div className="section-title">Chunk Map</div>
          <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
            <ChunkHighlighter
              text={chunkAnalysis.original_text}
              chunks={chunkAnalysis.chunks}
              selectedChunk={selectedChunk}
              onChunkClick={setSelectedChunk}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {CHUNK_LEGEND
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
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
