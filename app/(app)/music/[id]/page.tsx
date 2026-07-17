'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import SpotifySyncPlayer from '@/components/SpotifySyncPlayer'
import YoutubeAudioSyncPlayer from '@/components/YoutubeAudioSyncPlayer'
import SyncedLyricsList from '@/components/SyncedLyricsList'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import { awardXP } from '@/lib/xp'
import type { ChunkAnalysis, ChunkItem, Flashcard, Song } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import { parseLrc, findActiveLineIndex, estimateLineTimings } from '@/lib/media/lyrics/parser'
import { extractVideoId } from '@/lib/media/youtube/url'
import { extractSpotifyTrackId } from '@/lib/media/spotify/url'

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

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [savedFromLyrics, setSavedFromLyrics] = useState<Flashcard[]>([])

  const [level, setLevel] = useState<Level>('B1')
  const [chunkAnalysis, setChunkAnalysis] = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks] = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    setActiveLine(null)
    setDuration(0)
    apiFetch<Song>(`/api/music/songs/${id}`)
      .then(setSong)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [id])

  // Backfill: songs saved before audio-source resolution was wired up (or
  // saved from a plain search that never found a match) may have neither
  // spotify_url nor youtube_url — without either, there's no audio to sync,
  // only lyrics. Try once to resolve a playable source (Spotify preferred,
  // YouTube as fallback — merge-lyrics already searches for a matching video
  // for any song) and persist it so future visits don't repeat this.
  useEffect(() => {
    if (!song || song.spotify_url || song.youtube_url) return
    apiFetch<{ spotify_url?: string | null; youtube_url?: string | null; lrc_content?: string | null }>(
      '/api/music/merge-lyrics',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: song.artist, title: song.title, existing_youtube_url: song.youtube_url }),
      },
    ).then((merged) => {
      if (!merged.spotify_url && !merged.youtube_url) return
      const patch: { spotify_url?: string; youtube_url?: string; lrc_content?: string } = {}
      if (merged.spotify_url) patch.spotify_url = merged.spotify_url
      if (merged.youtube_url) patch.youtube_url = merged.youtube_url
      if (merged.lrc_content && !song.lrc_content) patch.lrc_content = merged.lrc_content
      return apiFetch<Song>(`/api/music/songs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(setSong)
    }).catch(() => { /* no match found — stay lyrics-only */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id])

  const lrcLines = useMemo(() => (song?.lrc_content ? parseLrc(song.lrc_content) : []), [song?.lrc_content])

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
      const card = chunkToFlashcard(chunk, chunkAnalysis.original_text)
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

  const spotifyId = song.spotify_url ? extractSpotifyTrackId(song.spotify_url) : null
  const videoId = song.youtube_url ? extractVideoId(song.youtube_url) : null
  const hasAudioSource = !!(spotifyId || videoId)

  const plainLines = song.plain_lyrics.split('\n').filter(Boolean)
  // No real LRC timing? Estimate per-line timestamps from the player's
  // duration so the highlight still roughly tracks playback instead of
  // sitting static.
  const effectiveLines = lrcLines.length > 0
    ? lrcLines
    : (hasAudioSource && duration > 0 ? estimateLineTimings(plainLines, duration) : [])
  const displayLines = effectiveLines.length > 0
    ? effectiveLines.map((l) => ({ text: l.text, time: l.time as number | null }))
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {videoId && (
            <a
              href={`/youtube?url=${encodeURIComponent(song.youtube_url ?? '')}`}
              style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', color: 'var(--ink)', textDecoration: 'none' }}
            >
              ▶ Watch the video on YouTube Studio
            </a>
          )}
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

        {/* LEFT: audio + synced lyrics */}
        <div style={{ flex: '1 1 55%', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {spotifyId ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <SpotifySyncPlayer
                trackId={spotifyId}
                onPositionChange={(t) => setActiveLine(findActiveLineIndex(effectiveLines, t))}
                onDurationChange={setDuration}
              />
            </div>
          ) : videoId ? (
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <YoutubeAudioSyncPlayer
                videoId={videoId}
                onPositionChange={(t) => setActiveLine(findActiveLineIndex(effectiveLines, t))}
                onDurationChange={setDuration}
              />
            </div>
          ) : null}

          <SyncedLyricsList
            lines={displayLines}
            activeLineIndex={hasAudioSource ? activeLine : null}
            maxHeight={hasAudioSource ? '44vh' : '65vh'}
            resetKey={song.id}
            onWordSaved={(card) => setSavedFromLyrics((prev) => [card, ...prev.filter((c) => c.id !== card.id)])}
          />

          {savedFromLyrics.length > 0 && (
            <>
              <div className="section-title">Saved from lyrics</div>
              {savedFromLyrics.map((card) => <GeneratedLearningCard key={card.id} card={card} />)}
            </>
          )}
        </div>

        {/* RIGHT: language chunks */}
        <div style={{ flex: '1 1 38%', minWidth: 280, position: 'sticky', top: 20, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
          <div className="section-title" style={{ marginTop: 0 }}>Language Chunks</div>
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
        </div>
      </div>
    </>
  )
}
