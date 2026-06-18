'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Hero from '@/components/ui/Hero'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import SpotifyConnectModal from '@/components/SpotifyConnectModal'
import UnverifiedModal from '@/components/UnverifiedModal'
import UnverifiedCard from '@/components/UnverifiedCard'
import { contentTabs } from '@/lib/product'
import type { ChunkAnalysis, ChunkItem, Flashcard, Song } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import type { LrcLibSearchHit } from '@/lib/lyrics'
import type { SpotifyTrackSummary } from '@/lib/spotify'

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

type Tab = 'discover' | 'library' | 'for-you'

interface WorkingSong {
  title: string
  artist: string
  lrc_content: string | null
  plain_lyrics: string
  youtube_url: string | null
  spotify_url: string | null
  spotify_track_id?: string
  lyrics_source?: string
  is_synced?: boolean
  verified?: boolean
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<Tab>('discover')
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(null)
  const [showSpotifyModal, setShowSpotifyModal] = useState(false)
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)

  // --- Discover state ---
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<LrcLibSearchHit[]>([])
  const [workingSong, setWorkingSong] = useState<WorkingSong | null>(null)
  const [fetchingLyrics, setFetchingLyrics] = useState(false)
  const [mergingLyrics, setMergingLyrics] = useState(false)

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

  // --- For You (Spotify feed) state ---
  const [feedTracks, setFeedTracks] = useState<SpotifyTrackSummary[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  const [error, setError] = useState('')

  // Check Spotify connection status on mount
  useEffect(() => {
    fetch('/api/spotify/status')
      .then((r) => r.json())
      .then((d: { connected: boolean }) => setSpotifyConnected(d.connected))
      .catch(() => setSpotifyConnected(false))
  }, [])

  // Handle post-OAuth redirect params
  useEffect(() => {
    if (searchParams.get('spotify_connected') === '1') {
      setSpotifyConnected(true)
      setShowSpotifyModal(false)
      // Re-merge if we have a working song
      if (workingSong && !workingSong.is_synced) {
        void handleMergeLyrics(workingSong)
      }
    }
    if (searchParams.get('spotify_error') === '1') {
      setError('Spotify connection failed. Please try again.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (tab === 'library') void loadLibrary()
    if (tab === 'for-you') void loadFeed()
  }, [tab])

  async function loadLibrary() {
    setLoadingLibrary(true)
    try {
      const songs = await apiFetch<Song[]>('/api/music/songs')
      setLibrarySongs(songs)
    } catch { /* silent */ }
    finally { setLoadingLibrary(false) }
  }

  async function loadFeed() {
    setLoadingFeed(true)
    try {
      const data = await apiFetch<{ tracks: SpotifyTrackSummary[]; needs_auth?: boolean }>(
        '/api/spotify/feed',
      )
      if ((data as { needs_auth?: boolean }).needs_auth) {
        setShowSpotifyModal(true)
      } else {
        setFeedTracks(data.tracks)
      }
    } catch {
      setShowSpotifyModal(true)
    } finally {
      setLoadingFeed(false)
    }
  }

  const handleMergeLyrics = useCallback(async (song: WorkingSong) => {
    setMergingLyrics(true)
    try {
      const merged = await apiFetch<{
        plain_lyrics: string
        lrc_content: string | null
        source: string
        is_synced: boolean
        title: string
        artist: string
      }>('/api/music/merge-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: song.artist,
          title: song.title,
          spotify_track_id: song.spotify_track_id,
        }),
      })
      setWorkingSong((prev) =>
        prev
          ? {
              ...prev,
              plain_lyrics: merged.plain_lyrics || prev.plain_lyrics,
              lrc_content: merged.lrc_content ?? prev.lrc_content,
              lyrics_source: merged.source,
              is_synced: merged.is_synced,
            }
          : prev,
      )
    } catch { /* keep existing lyrics */ }
    finally { setMergingLyrics(false) }
  }, [])

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
        const song = await apiFetch<WorkingSong & { not_found?: boolean; verified?: boolean }>(
          '/api/music/resolve-url',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: q }),
          },
        )
        setWorkingSong({ ...song, verified: song.verified ?? true })
        void handleMergeLyrics(song)
        if (song.verified === false) {
          setShowUnverifiedModal(true)
        } else if (!song.is_synced && !spotifyConnected) {
          setShowSpotifyModal(true)
        }
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
    const song: WorkingSong = {
      title: hit.trackName,
      artist: hit.artistName,
      lrc_content: hit.syncedLyrics ?? null,
      plain_lyrics: hit.plainLyrics ?? extractPlainFromLrc(hit.syncedLyrics ?? ''),
      youtube_url: null,
      spotify_url: null,
    }
    setWorkingSong({ ...song, verified: true })
    void handleMergeLyrics(song)
    if (!hit.syncedLyrics && !spotifyConnected) {
      setShowSpotifyModal(true)
    }
  }

  function handleSelectFeedTrack(track: SpotifyTrackSummary) {
    setTab('discover')
    setQuery(`${track.title} ${track.artist}`)
    const song: WorkingSong = {
      title: track.title,
      artist: track.artist,
      lrc_content: null,
      plain_lyrics: '',
      youtube_url: null,
      spotify_url: track.spotify_url,
      spotify_track_id: track.id,
    }
    setWorkingSong(song)
    setFeedTracks([])
    setMergingLyrics(true)
    handleMergeLyrics(song)
      .catch(() => {})
      .finally(() => setMergingLyrics(false))
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

  async function handleDisconnectSpotify() {
    await fetch('/api/spotify/disconnect', { method: 'POST' })
    setSpotifyConnected(false)
  }

  const highChunks = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  const loading = searching || fetchingLyrics

  return (
    <>
      {showSpotifyModal && (
        <SpotifyConnectModal
          returnTo="/music"
          onClose={() => setShowSpotifyModal(false)}
        />
      )}

      {showUnverifiedModal && (
        <UnverifiedModal
          context="music"
          onAddAnyway={() => {
            setShowUnverifiedModal(false)
            if (pendingSave) {
              setPendingSave(false)
              void handleSaveToLibrary()
            }
          }}
          onCancel={() => {
            setShowUnverifiedModal(false)
            setPendingSave(false)
          }}
        />
      )}

      <Hero
        title="Learn"
        subtitle="Music workspace."
        body="Search a song or paste a media URL, load lyrics, analyze natural spoken language, save chunks, and turn them into reviewable cards."
      />

      <div className="learn-tabs">
        {contentTabs.map((item) => (
          <a key={item.href} href={item.href} className={`learn-tab${item.href === '/music' ? ' active' : ''}`}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { id: 'discover', label: '⊕ Discover' },
          { id: 'library', label: '♪ My Library' },
          { id: 'for-you', label: '✦ For You' },
        ] as { id: Tab; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 22px',
              borderRadius: 999,
              border: `1.5px solid ${tab === t.id ? 'var(--ink)' : 'var(--line)'}`,
              background: tab === t.id ? 'var(--ink)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--muted)',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {t.label}
            {t.id === 'for-you' && spotifyConnected === false && (
              <span style={{ marginLeft: 6, fontSize: '0.65rem', opacity: 0.7 }}>connect Spotify</span>
            )}
          </button>
        ))}

        {spotifyConnected && (
          <button
            onClick={handleDisconnectSpotify}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: 999,
              border: '1.5px solid var(--line)',
              background: 'transparent',
              fontSize: '0.72rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DB954', display: 'inline-block' }} />
            Spotify connected
          </button>
        )}
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
                          {Math.floor(hit.duration / 60)}:{String(hit.duration % 60).padStart(2, '0')}
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
                    onClick={() => {
                      if (workingSong?.verified === false) {
                        setPendingSave(true)
                        setShowUnverifiedModal(true)
                      } else {
                        void handleSaveToLibrary()
                      }
                    }}
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

              {/* Unverified warning */}
              {workingSong.verified === false && !mergingLyrics && (
                <div style={{ marginBottom: 14 }}>
                  <UnverifiedCard />
                </div>
              )}

              {/* Lyrics quality badge */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {mergingLyrics && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(100,100,100,0.1)', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span className="spinner" style={{ width: 10, height: 10 }} />
                    Improving lyrics…
                  </span>
                )}
                {!mergingLyrics && workingSong.is_synced && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)' }}>
                    ✓ Synced — {workingSong.lyrics_source ?? 'lrclib'}
                  </span>
                )}
                {!mergingLyrics && workingSong.lrc_content && !workingSong.is_synced && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)' }}>
                    ✓ Synced lyrics available
                  </span>
                )}
                {!mergingLyrics && !workingSong.is_synced && !workingSong.lrc_content && !spotifyConnected && (
                  <button
                    onClick={() => setShowSpotifyModal(true)}
                    style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(29,185,84,0.12)', color: '#1DB954', border: 'none', cursor: 'pointer' }}
                  >
                    ✦ Connect Spotify for better lyrics
                  </button>
                )}
              </div>

              {workingSong.plain_lyrics ? (
                <>
                  <details style={{ marginBottom: 16 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Read lyrics</summary>
                    <pre className="music-lyrics-pre" style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
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
                    <button className="btn-primary btn-wide" onClick={handleAnalyzeChunks} disabled={analyzing || mergingLyrics}>
                      {analyzing ? <><span className="spinner" />Analyzing chunks…</> : 'Analyze language chunks'}
                    </button>
                  </div>
                </>
              ) : mergingLyrics ? (
                <div className="alert-info">Finding the best lyrics from all sources…</div>
              ) : (
                <div className="alert-info">
                  No lyrics found for this song. You can{' '}
                  <button
                    style={{ color: 'var(--moss)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => setWorkingSong({ ...workingSong, plain_lyrics: ' ' })}
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

      {/* ─── FOR YOU TAB ──────────────────────────────── */}
      {tab === 'for-you' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>Your Music</div>
            {spotifyConnected && (
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1DB954', display: 'inline-block' }} />
                Based on your Spotify listening
              </span>
            )}
          </div>

          {!spotifyConnected && !loadingFeed && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎧</div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 8 }}>
                Connect Spotify to see your music
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 20 }}>
                We'll build a personalized list of songs to study based on your listening history.
              </p>
              <button
                onClick={() => setShowSpotifyModal(true)}
                style={{
                  background: '#1DB954',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 28px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                }}
              >
                Connect Spotify
              </button>
            </div>
          )}

          {loadingFeed && <div className="alert-info">Loading your personalized feed…</div>}

          {feedTracks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feedTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectFeedTrack(track)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid var(--line)',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'box-shadow 120ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)' }}
                >
                  {track.album_art ? (
                    <img
                      src={track.album_art}
                      alt={track.album}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(29,185,84,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>
                      ♪
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                      {track.artist}
                      {track.album ? ` · ${track.album}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>
                      {formatDuration(track.duration_ms)}
                    </span>
                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 999, background: 'rgba(29,185,84,0.12)', color: '#1DB954', fontWeight: 700 }}>
                      Study →
                    </span>
                  </div>
                </button>
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
