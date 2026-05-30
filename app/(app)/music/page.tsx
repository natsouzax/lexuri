'use client'

import { useState } from 'react'
import Hero from '@/components/ui/Hero'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import type { ChunkAnalysis, ChunkItem, Flashcard, SongData } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const LEVEL_OPTIONS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVEL_OPTIONS)[number]

export default function MusicPage() {
  const [query, setQuery] = useState('')
  const [song, setSong] = useState<SongData | null>(null)
  const [searching, setSearching] = useState(false)

  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)

  const [error, setError] = useState('')

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setSong(null)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
    try {
      const data = await apiFetch<SongData>(`/api/genius/search?q=${encodeURIComponent(query)}`)
      setSong(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setSearching(false)
    }
  }

  async function handleAnalyzeChunks() {
    if (!song?.lyrics) return
    setAnalyzing(true)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setError('')
    try {
      const result = await apiFetch<ChunkAnalysis>('/api/llm/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: song.lyrics, level }),
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
      const card: Flashcard = chunkToFlashcard(chunk, chunkAnalysis.original_text)
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSavedChunks((prev) => new Set(prev).add(chunk.text))
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      <Hero
        title="Music Lab"
        subtitle="Learn English the way your brain actually works."
        body="Search for a song, identify natural language chunks — phrasal verbs, idioms, collocations — and build flashcards from real spoken English."
      />

      {/* Search */}
      <div className="section-title">Find A Song</div>
      <div className="input-row">
        <input
          className="input-field"
          placeholder="e.g. Billie Eilish Birds of a Feather"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={handleSearch} disabled={searching}>
          {searching ? <><span className="spinner" />Searching…</> : 'Find song'}
        </button>
      </div>
      {error && <div className="alert-error">{error}</div>}

      {song && (
        <>
          <div className="section-title">Lyrics Workspace</div>
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.35rem', marginBottom: 8 }}>
            {song.title} — {song.artist}
          </div>

          {song.genius_url && (
            <div className="alert-info" style={{ marginBottom: 16 }}>
              Lyrics extraction is not yet implemented.{' '}
              <a href={song.genius_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--moss)', fontWeight: 700 }}>
                Read lyrics on Genius →
              </a>
            </div>
          )}

          {song.lyrics && song.lyrics.length > 100 && (
            <>
              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Read raw lyrics</summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
                  {song.lyrics}
                </pre>
              </details>

              {/* Level selector + Analyze button */}
              <div className="input-row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
                <button className="btn-primary btn-wide" onClick={handleAnalyzeChunks} disabled={analyzing}>
                  {analyzing ? <><span className="spinner" />Analyzing chunks…</> : 'Analyze language chunks'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {chunkAnalysis && (
        <>
          {/* Highlighted lyrics */}
          <div className="section-title">Chunk Map</div>
          <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
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

          {/* High importance chunks */}
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

          {/* Other chunks */}
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

      {!song && !searching && (
        <div className="alert-info">
          Search a song to analyze its language chunks and build flashcards from real English.
        </div>
      )}
    </>
  )
}
