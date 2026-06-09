'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Hero from '@/components/ui/Hero'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import type { ChunkAnalysis, ChunkItem, Flashcard, Song } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import type { LrcLibSearchHit } from '@/lib/lyrics'

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

function isUrl(input: string): boolean {
  return /^https?:\/\//.test(input.trim()) || input.includes('spotify.com') || input.includes('youtu')
}

const LEVEL_OPTIONS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVEL_OPTIONS)[number]

type Tab = 'discover' | 'library'

interface WorkingSong {
  title: string
  artist: string
  lrc_content: string | null
  plain_lyrics: string
  youtube_url: string | null
  spotify_url: string | null
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('discover')

  // --- Discover state ---
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<LrcLibSearchHit[]>([])
  const [workingSong, setWorkingSong] = useState<WorkingSong | null>(null)
  const [fetchingLyrics, setFetchingLyrics] = useState(false)

  // --- Analysis state ---
  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedSongId, setSavedSongId] = useState<string | null>(null)

  // --- Library state ---
  const [librarySongs, setLibrarySongs] = useState<Song[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    if (tab === 'library') loadLibrary()
  }, [tab])

  async function loadLibrary() {
    setLoadingLibrary(true)
    try {
      const songs = await apiFetch<Song[]>('/api/music/songs')
      setLibrarySongs(songs)
    } catch { /* silent */ }
    finally { setLoadingLibrary(false) }
  }

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setError('')
    setSearchResults([])
    setWorkingSong(null)
    setChunkAnalysis(null)
    setSavedSongId(null)

    if (isUrl(q)) {
      setFetchingLyrics(true)
      try {
        const song = await apiFetch<WorkingSong>('/api/music/resolve-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: q }),
        })
        setWorkingSong(song)
      } catch (e) {
        setError(String(e))
      } finally {
        setFetchingLyrics(false)
      }
    } else {
      setSearching(true)
      try {
        const hits = await apiFetch<LrcLibSearchHit[]>(`/api/music/search?q=${encodeURIComponent(q)}`)
        setSearchResults(hits.slice(0, 12))
        if (!hits.length) setError('No results found. Try a different search.')
      } catch (e) {
        setError(String(e))
      } finally {
        setSearching(false)
      }
    }
  }

  function handleSelectResult(hit: LrcLibSearchHit) {
    setError('')
    setChunkAnalysis(null)
    setSavedSongId(null)
    setSearchResults([])
    setWorkingSong({
      title: hit.trackName,
      artist: hit.artistName,
      lrc_content: hit.syncedLyrics ?? null,
      plain_lyrics: hit.plainLyrics ?? extractPlainFromLrc(hit.syncedLyrics ?? ''),
      youtube_url: null,
      spotify_url: null,
    })
  }

  async function handleAnalyzeChunks() {
    if (!workingSong?.plain_lyrics) return
    setAnalyzing(true)
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
    setError('')
    try {
      const result = await apiFetch<ChunkAnalysis>('/api/llm/chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: workingSong.plain_lyrics, level }),
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
      awardXP('chunk_saved')
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  async function handleSaveToLibrary() {
    if (!workingSong) return
    setSaving(true)
    setError('')
    try {
      const song = await apiFetch<Song>('/api/music/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: workingSong.title,
          artist: workingSong.artist,
          plain_lyrics: workingSong.plain_lyrics,
          lrc_content: workingSong.lrc_content,
          youtube_url: workingSong.youtube_url,
          spotify_url: workingSong.spotify_url,
        }),
      })
      setSavedSongId(song.id)
      awardXP('music_studied')
      router.push(`/music/${song.id}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  const loading = searching || fetchingLyrics

  return (
    <>
      <Hero
        title="Music Lab"
        subtitle="Learn English the way your brain actually works."
        body="Search for a song, identify natural language chunks — phrasal verbs, idioms, collocations — and build flashcards from real spoken English."
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['discover', 'library'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 22px',
              borderRadius: 999,
              border: `1.5px solid ${tab === t ? 'var(--ink)' : 'var(--line)'}`,
              background: tab === t ? 'var(--ink)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--muted)',
              fontWeight: tab === t ? 700 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {t === 'discover' ? '⊕ Discover' : '♪ My Library'}
          </button>
        ))}
      </div>

      {/* ─── DISCOVER TAB ─────────────────────────────── */}
      {tab === 'discover' && (
        <>
          <div className="section-title">Find A Song</div>
          <div className="input-row">
            <input
              className="input-field"
              placeholder="Song title, artist, or paste a YouTube / Spotify URL"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <><span className="spinner" />Searching…</> : 'Search'}
            </button>
          </div>
          {error && <div className="alert-error">{error}</div>}

          {/* Search results */}
          {searchResults.length > 0 && !workingSong && (
            <>
              <div className="section-title">Results</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {searchResults.map((hit) => (
                  <button
                    key={hit.id}
                    onClick={() => handleSelectResult(hit)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      background: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'box-shadow 120ms ease',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(140,30,180,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>
                      ♪
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hit.trackName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                        {hit.artistName}{hit.albumName ? ` · ${hit.albumName}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {hit.duration > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>
                          {formatDuration(hit.duration)}
                        </span>
                      )}
                      {hit.syncedLyrics && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'rgba(70,98,74,0.15)', color: 'var(--moss)' }}>
                          synced
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Song workspace */}
          {workingSong && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.35rem' }}>
                    {workingSong.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>{workingSong.artist}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '7px 16px' }}
                    onClick={handleSaveToLibrary}
                    disabled={saving || !!savedSongId}
                  >
                    {savedSongId ? '✓ Saved' : saving ? <><span className="spinner" />Saving…</> : '+ Save to Library'}
                  </button>
                  <button
                    style={{ fontSize: '0.8rem', padding: '7px 16px', borderRadius: 999, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer', color: 'var(--muted)' }}
                    onClick={() => { setWorkingSong(null); setChunkAnalysis(null); setSavedSongId(null) }}
                  >
                    ← Back
                  </button>
                </div>
              </div>

              {workingSong.lrc_content && (
                <div style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)', display: 'inline-block', marginBottom: 12 }}>
                  ✓ Synced lyrics available
                </div>
              )}

              {workingSong.plain_lyrics ? (
                <>
                  <details style={{ marginBottom: 16 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Read lyrics</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
                      {workingSong.plain_lyrics}
                    </pre>
                  </details>

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
              ) : (
                <div className="alert-info">
                  No lyrics found for this song. You can{' '}
                  <button
                    style={{ color: 'var(--moss)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => {
                      setWorkingSong({ ...workingSong, plain_lyrics: '' })
                    }}
                  >
                    paste them manually
                  </button>
                  .
                </div>
              )}
            </>
          )}

          {/* Chunk analysis */}
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

          {!workingSong && !loading && !searchResults.length && (
            <div className="alert-info">
              Search for a song by title/artist, or paste a YouTube or Spotify URL.
            </div>
          )}
        </>
      )}

      {/* ─── MY LIBRARY TAB ───────────────────────────── */}
      {tab === 'library' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>My Songs</div>
            <button
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 16px' }}
              onClick={() => setTab('discover')}
            >
              + New song
            </button>
          </div>

          {loadingLibrary && <div className="alert-info">Loading your library…</div>}

          {!loadingLibrary && librarySongs.length === 0 && (
            <div className="alert-info">
              You haven't saved any songs yet. Go to Discover to find and analyze a song.
            </div>
          )}

          {librarySongs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {librarySongs.map((song) => (
                <a
                  key={song.id}
                  href={`/music/${song.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: '1px solid var(--line)',
                    background: '#fff',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'box-shadow 120ms ease, transform 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.boxShadow = 'var(--shadow-md)'
                    el.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.boxShadow = 'var(--shadow-sm)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(140,30,180,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>
                    ♪
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>{song.artist}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {song.chunks_count > 0 && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--moss)' }}>
                        {song.chunks_count} chunks
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(song.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

function extractPlainFromLrc(lrc: string): string {
  return lrc
    .split('\n')
    .map((line) => line.replace(/^\[\d{1,2}:\d{2}\.\d+\]/, '').trim())
    .filter(Boolean)
    .join('\n')
}
