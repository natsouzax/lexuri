'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import type { ChunkAnalysis, ChunkItem, Flashcard, Song } from '@/lib/types'
import { chunkToFlashcard, normalizeFlashcard } from '@/lib/types'
import { parseLrc } from '@/lib/lyrics'
import type { LrcLine } from '@/lib/lyrics'

declare global {
  interface Window {
    YT: {
      Player: new (id: string, opts: YTOpts) => YTPlayer
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}
interface YTOpts {
  videoId?: string
  playerVars?: Record<string, unknown>
  events?: {
    onStateChange?: (e: { data: number }) => void
  }
}
interface YTPlayer {
  getCurrentTime(): number
  destroy(): void
}

interface WordDef {
  word: string
  partOfSpeech: string
  definition: string
  example: string
  translation: string
}

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

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

function extractSpotifyTrackId(url: string): string | null {
  const m = url.match(/track\/([A-Za-z0-9]+)/)
  return m?.[1] ?? null
}

function tokenize(text: string): { display: string; lookup: string }[] {
  return text.split(/(\s+)/).map((tok) => ({
    display: tok,
    lookup: tok.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '').toLowerCase(),
  }))
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
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

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [lrcLines, setLrcLines] = useState<LrcLine[]>([])
  const [plainLines, setPlainLines] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)

  const [selectedWord, setSelectedWord] = useState('')
  const [wordContext, setWordContext] = useState('')
  const [wordDef, setWordDef] = useState<WordDef | null>(null)
  const [defLoading, setDefLoading] = useState(false)
  const [defError, setDefError] = useState('')
  const [wordFlashcardSaved, setWordFlashcardSaved] = useState(false)
  const [savingWordFlashcard, setSavingWordFlashcard] = useState(false)

  const [rightTab, setRightTab] = useState<'word' | 'chunks'>('word')

  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState('')

  const playerRef = useRef<YTPlayer | null>(null)
  const lrcLinesRef = useRef<LrcLine[]>([])
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playerId = `yt-player-${id}`

  useEffect(() => {
    apiFetch<Song>(`/api/music/songs/${id}`)
      .then((s) => {
        setSong(s)
        if (s.lrc_content) {
          const lines = parseLrc(s.lrc_content)
          setLrcLines(lines)
          lrcLinesRef.current = lines
        } else if (s.plain_lyrics) {
          setPlainLines(s.plain_lyrics.split('\n').filter(Boolean))
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!song?.youtube_url) return
    const videoId = extractYouTubeId(song.youtube_url)
    if (!videoId) return

    function syncLine() {
      if (!playerRef.current) return
      const t = playerRef.current.getCurrentTime()
      const lines = lrcLinesRef.current
      let found = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].time <= t) found = i
        else break
      }
      setActiveLine(found >= 0 ? found : null)
    }

    function createPlayer() {
      if (playerRef.current) return
      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              if (!pollingRef.current) pollingRef.current = setInterval(syncLine, 500)
            } else {
              if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script')
        tag.id = 'yt-api-script'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [song, playerId])

  useEffect(() => {
    if (activeLine !== null) {
      lineRefs.current[activeLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeLine])

  async function handleWordClick(word: string, context: string) {
    if (!word) return
    setSelectedWord(word)
    setWordContext(context)
    setWordDef(null)
    setDefError('')
    setWordFlashcardSaved(false)
    setRightTab('word')
    setDefLoading(true)
    try {
      const def = await apiFetch<WordDef>('/api/llm/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, context }),
      })
      setWordDef(def)
      awardXP('word_looked_up')
    } catch (e) {
      setDefError(String(e))
    } finally {
      setDefLoading(false)
    }
  }

  async function handleSaveWordFlashcard() {
    if (!wordDef) return
    setSavingWordFlashcard(true)
    try {
      const card = normalizeFlashcard({
        word: wordDef.word,
        translation: wordDef.translation,
        explanation: `(${wordDef.partOfSpeech}) ${wordDef.definition}`,
        example: wordDef.example,
      })
      if (card) {
        await apiFetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: [card] }),
        })
      }
      setWordFlashcardSaved(true)
    } catch (e) {
      setDefError(String(e))
    } finally {
      setSavingWordFlashcard(false)
    }
  }

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
      awardXP('chunk_analyzed')
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
      awardXP('chunk_saved')
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

  const ytId = song.youtube_url ? extractYouTubeId(song.youtube_url) : null
  const spotifyId = song.spotify_url ? extractSpotifyTrackId(song.spotify_url) : null
  const hasPlayer = !!(ytId || spotifyId)

  const displayLines = lrcLines.length > 0
    ? lrcLines.map((l) => ({ text: l.text, time: l.time as number | null }))
    : plainLines.map((l) => ({ text: l, time: null as number | null }))

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      {/* Header bar */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Link href="/music" style={{ fontSize: '0.83rem', color: 'var(--muted)', fontWeight: 700, textDecoration: 'none' }}>
          ← Music Lab
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          {song.lrc_content && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)' }}>
              ✓ Synced
            </span>
          )}
          {song.chunks_count > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(72,144,226,0.12)', color: '#4A90E2' }}>
              {song.chunks_count} chunks
            </span>
          )}
        </div>
      </div>

      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.7rem', lineHeight: 1.1, marginBottom: 4 }}>
        {song.title}
      </h1>
      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 700, marginBottom: 20 }}>{song.artist}</div>

      {/* Studio two-panel layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT: player + lyrics */}
        <div style={{ flex: '1 1 55%', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {ytId && (
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: '#000', boxShadow: 'var(--shadow-md)' }}>
              <div id={playerId} style={{ width: '100%', height: '100%' }} />
            </div>
          )}

          {!ytId && spotifyId && (
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <iframe
                src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator`}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ border: 'none', display: 'block' }}
              />
            </div>
          )}

          {/* Lyrics panel */}
          <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--line)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Lyrics — click any word to look it up
            </div>
            <div style={{ maxHeight: hasPlayer ? '44vh' : '65vh', overflowY: 'auto', padding: '8px 8px' }}>
              {displayLines.length > 0 ? displayLines.map((line, i) => {
                const isActive = activeLine === i
                const tokens = tokenize(line.text)
                return (
                  <div
                    key={i}
                    ref={(el) => { lineRefs.current[i] = el }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      borderLeft: `3px solid ${isActive ? 'var(--clay)' : 'transparent'}`,
                      background: isActive ? 'rgba(200,111,74,0.09)' : 'transparent',
                      transition: 'all 100ms ease',
                      fontSize: '0.91rem',
                      lineHeight: 1.9,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'baseline',
                    }}
                  >
                    {line.time !== null && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted)', opacity: 0.45, flexShrink: 0, fontVariantNumeric: 'tabular-nums', paddingTop: 2 }}>
                        {formatTime(line.time)}
                      </span>
                    )}
                    <span>
                      {tokens.map((tok, j) =>
                        tok.lookup ? (
                          <span
                            key={j}
                            onClick={() => handleWordClick(tok.lookup, line.text)}
                            title={tok.lookup}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 3,
                              padding: '0 1px',
                              color: selectedWord === tok.lookup ? 'var(--clay)' : isActive ? 'var(--ink)' : 'var(--muted)',
                              fontWeight: isActive ? 600 : 400,
                              background: selectedWord === tok.lookup ? 'rgba(200,111,74,0.15)' : 'transparent',
                              transition: 'color 80ms, background 80ms',
                              textDecoration: selectedWord === tok.lookup ? 'underline' : 'none',
                              textDecorationStyle: 'dotted',
                            }}
                          >
                            {tok.display}
                          </span>
                        ) : (
                          <span key={j}>{tok.display}</span>
                        )
                      )}
                    </span>
                  </div>
                )
              }) : (
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: '16px' }}>No lyrics available.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: word lookup + chunks tabs */}
        <div style={{ flex: '1 1 38%', minWidth: 280, position: 'sticky', top: 20, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {(['word', 'chunks'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 999,
                  border: `1.5px solid ${rightTab === t ? 'var(--clay)' : 'var(--line)'}`,
                  background: rightTab === t ? 'var(--clay)' : 'transparent',
                  color: rightTab === t ? '#fff' : 'var(--muted)',
                  fontWeight: rightTab === t ? 700 : 400,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                {t === 'word' ? 'Word Lookup' : 'Language Chunks'}
              </button>
            ))}
          </div>

          {/* Word Lookup */}
          {rightTab === 'word' && (
            <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px', minHeight: 200 }}>
              {!selectedWord ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', padding: '40px 10px', lineHeight: 1.8 }}>
                  Click any word in the lyrics<br />to look it up instantly.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.55rem', color: 'var(--ink)' }}>
                      {selectedWord}
                    </span>
                    {wordDef && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                        {wordDef.partOfSpeech}
                      </span>
                    )}
                  </div>

                  {wordContext && (
                    <div style={{ fontSize: '0.77rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 14, padding: '6px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: 7, borderLeft: '3px solid var(--line)', lineHeight: 1.6 }}>
                      "{wordContext}"
                    </div>
                  )}

                  {defLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: '0.88rem', padding: '8px 0' }}>
                      <span className="spinner" />
                      Looking up…
                    </div>
                  )}

                  {defError && <div className="alert-error" style={{ fontSize: '0.82rem' }}>{defError}</div>}

                  {wordDef && !defLoading && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Definition</div>
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink)' }}>{wordDef.definition}</div>
                      </div>

                      {wordDef.translation && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Translation</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--moss)', fontWeight: 700 }}>{wordDef.translation}</div>
                        </div>
                      )}

                      {wordDef.example && (
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Example</div>
                          <div style={{ fontSize: '0.83rem', fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.6 }}>"{wordDef.example}"</div>
                        </div>
                      )}

                      <button
                        className="btn-primary btn-wide"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handleSaveWordFlashcard}
                        disabled={savingWordFlashcard || wordFlashcardSaved}
                      >
                        {wordFlashcardSaved
                          ? '✓ Saved to flashcards'
                          : savingWordFlashcard
                          ? <><span className="spinner" />Saving…</>
                          : '+ Save as Flashcard'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Language Chunks */}
          {rightTab === 'chunks' && (
            <div>
              {song.plain_lyrics && (
                <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>Level:</span>
                      {LEVEL_OPTIONS.map((l) => (
                        <button
                          key={l}
                          onClick={() => setLevel(l)}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            border: `1.5px solid ${level === l ? 'var(--clay)' : 'var(--line)'}`,
                            background: level === l ? 'var(--clay)' : 'transparent',
                            color: level === l ? '#fff' : 'var(--muted)',
                            fontWeight: level === l ? 700 : 400,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                      onClick={handleAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing ? <><span className="spinner" />Analyzing…</> : chunkAnalysis ? 'Re-analyze' : 'Analyze'}
                    </button>
                  </div>
                </div>
              )}

              {analysisError && <div className="alert-error">{analysisError}</div>}

              {!chunkAnalysis && !analyzing && (
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', padding: '30px 10px', lineHeight: 1.8 }}>
                  Analyze to find phrasal verbs,<br />idioms, and language chunks.
                </div>
              )}

              {chunkAnalysis && (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                    <ChunkHighlighter
                      text={chunkAnalysis.original_text}
                      chunks={chunkAnalysis.chunks}
                      selectedChunk={selectedChunk}
                      onChunkClick={setSelectedChunk}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {CHUNK_LEGEND
                      .filter(({ type }) => chunkAnalysis.chunks.some((c) => c.type === type))
                      .map(({ label, color }) => (
                        <span key={label} style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: color + '22', color }}>
                          {label}
                        </span>
                      ))}
                  </div>

                  {highChunks.length > 0 && (
                    <>
                      <div className="section-title">Key Expressions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            </div>
          )}
        </div>
      </div>
    </>
  )
}
