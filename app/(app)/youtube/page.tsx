'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Hero from '@/components/ui/Hero'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import { contentTabs } from '@/lib/product'
import { awardXP } from '@/lib/xp'
import type { ChunkAnalysis, ChunkItem, Flashcard, VideoData } from '@/lib/types'
import { chunkToFlashcard } from '@/lib/types'
import feedItems from '@/data/feed-items.json'

interface ExampleVideo {
  id: string
  title: string
  youtube_id: string
  level: string
  kind: 'music video' | 'video'
  subtitle: string
}

const EXAMPLE_VIDEOS: ExampleVideo[] = (feedItems as Array<{
  id: string
  type: string
  title: string
  artist?: string
  channel?: string
  youtube_id: string
  level: string
  featured?: boolean
}>)
  .filter((item) => item.featured && item.youtube_id)
  .map((item) => ({
    id: item.id,
    title: item.title,
    youtube_id: item.youtube_id,
    level: item.level,
    kind: item.type === 'music' ? 'music video' : 'video',
    subtitle: item.artist ?? item.channel ?? '',
  }))

interface SavedVideo {
  url: string
  video_id: string
  title: string
  thumbnail: string
  saved_at: string
}

const SAVED_KEY = 'lexuri_saved_yt_videos'

function loadSaved(): SavedVideo[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as SavedVideo[]
  } catch {
    return []
  }
}

function persistSaved(list: SavedVideo[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list))
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function YouTubePage() {
  const searchParams = useSearchParams()
  const [url, setUrl]           = useState('')
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [savedCards, setSavedCards]           = useState<Flashcard[]>([])

  const [chunkAnalysis, setChunkAnalysis]     = useState<ChunkAnalysis | null>(null)
  const [analyzing, setAnalyzing]             = useState(false)
  const [selectedChunk, setSelectedChunk]     = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks]         = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)

  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([])
  const [isVideoSaved, setIsVideoSaved] = useState(false)

  useEffect(() => { setSavedVideos(loadSaved()) }, [])

  useEffect(() => {
    if (!videoData) { setIsVideoSaved(false); return }
    setIsVideoSaved(savedVideos.some((v) => v.video_id === videoData.video_id))
  }, [videoData, savedVideos])

  // Deep-link support: /youtube?url=... auto-loads the video (e.g. the
  // "Watch the video on YouTube Studio" link from the Music workspace).
  useEffect(() => {
    const deepLinkUrl = searchParams.get('url')
    if (deepLinkUrl) void handleLoadVideo(deepLinkUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Auto-analyze as soon as video loads
  useEffect(() => {
    if (!videoData) return
    handleAnalyzeChunks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoData])

  async function handleLoadVideo(loadUrl = url) {
    if (!loadUrl.trim()) return
    setLoading(true)
    setError('')
    setVideoData(null)
    setSavedCards([])
    setChunkAnalysis(null)
    setSelectedChunk(null)
    setSavedChunks(new Set())
    try {
      const data = await apiFetch<VideoData>('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: loadUrl }),
      })
      setVideoData(data)
      setUrl(loadUrl)
      awardXP('video_studied')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleSaveVideo() {
    if (!videoData) return
    const entry: SavedVideo = {
      url,
      video_id: videoData.video_id,
      title: videoData.title,
      thumbnail: `https://img.youtube.com/vi/${videoData.video_id}/mqdefault.jpg`,
      saved_at: new Date().toISOString(),
    }
    const updated = [entry, ...savedVideos.filter((v) => v.video_id !== videoData.video_id)]
    persistSaved(updated)
    setSavedVideos(updated)
    setIsVideoSaved(true)
  }

  function handleRemoveSaved(video_id: string) {
    const updated = savedVideos.filter((v) => v.video_id !== video_id)
    persistSaved(updated)
    setSavedVideos(updated)
    if (videoData?.video_id === video_id) setIsVideoSaved(false)
  }

  function handleWordSaved(card: Flashcard) {
    setSavedCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)])
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
        body: JSON.stringify({ text: videoData.transcript }),
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
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  const highChunks  = chunkAnalysis?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = chunkAnalysis?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      <Hero
        title="YouTube Studio"
        subtitle="Any video. Any clip. Study it."
        body="Paste a YouTube URL, get the transcript synced to the video, save useful expressions as flashcards, and keep a personal library of videos worth revisiting."
      />

      <div className="learn-tabs">
        {contentTabs.map((tab) => (
          <a key={tab.href} href={tab.href} className={`learn-tab${tab.href === '/youtube' ? ' active' : ''}`}>
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </a>
        ))}
      </div>

      {/* ── Load video ─────────────────────────────────────────────────────── */}
      <div className="section-title">Load a Video or Clip</div>
      <div className="input-row">
        <input
          className="input-field"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
        />
        <button className="btn-primary" onClick={() => handleLoadVideo()} disabled={loading}>
          {loading ? <><span className="spinner" />Loading…</> : 'Load'}
        </button>
      </div>
      {error && <div className="alert-error">{error}</div>}

      {/* ── Example videos ─────────────────────────────────────────────────── */}
      {!videoData && !loading && EXAMPLE_VIDEOS.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 24 }}>Not sure what to try? Pick one:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 8 }}>
            {EXAMPLE_VIDEOS.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleLoadVideo(`https://www.youtube.com/watch?v=${ex.youtube_id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${ex.youtube_id}/mqdefault.jpg`}
                  alt={ex.title}
                  style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ex.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {ex.kind} · {ex.level}{ex.subtitle ? ` · ${ex.subtitle}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Lesson workspace ───────────────────────────────────────────────── */}
      {videoData && (
        <>
          <div className="section-title" style={{ marginTop: 32 }}>
            <span>{videoData.title}</span>
            <button
              onClick={isVideoSaved ? () => handleRemoveSaved(videoData.video_id) : handleSaveVideo}
              style={{
                marginLeft: 'auto',
                border: `1.5px solid ${isVideoSaved ? 'var(--clay)' : 'var(--line)'}`,
                borderRadius: 999,
                padding: '5px 16px',
                background: isVideoSaved ? 'rgba(200,111,74,0.1)' : '#fff',
                color: isVideoSaved ? 'var(--clay)' : 'var(--muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {isVideoSaved ? '★ Saved' : '☆ Save video'}
            </button>
          </div>

          <YoutubeSyncPlayer
            videoId={videoData.video_id}
            segments={videoData.segments}
            chunks={chunkAnalysis?.chunks}
            selectedChunk={selectedChunk}
            onChunkSelect={setSelectedChunk}
            onWordSaved={handleWordSaved}
          />

          {savedCards.length > 0 && (
            <>
              <div className="section-title">Saved from captions</div>
              {savedCards.map((card) => <GeneratedLearningCard key={card.id} card={card} />)}
            </>
          )}

          {analyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
              <span className="spinner" />Mapping chunks…
            </div>
          )}

          {chunkAnalysis && (
            <>
              <div className="panel" style={{ marginBottom: 16 }}>
                <span className="mini-label">AI chunk map ready</span>
                <p className="panel-copy">
                  {chunkAnalysis.chunks.length} expressions detected. Save the ones you want to remember.
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
                    <span key={label} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '22', color }}>{label}</span>
                  ))}
              </div>

              {highChunks.length > 0 && (
                <>
                  <div className="section-title">Key Expressions</div>
                  <div className="three-col" style={{ marginBottom: 24 }}>
                    {highChunks.map((chunk) => (
                      <ChunkCard key={chunk.text + chunk.start} chunk={chunk} isSelected={selectedChunk?.text === chunk.text} onSelect={setSelectedChunk} onMakeFlashcard={handleMakeFlashcard} making={makingFlashcard === chunk.text} saved={savedChunks.has(chunk.text)} />
                    ))}
                  </div>
                </>
              )}

              {otherChunks.length > 0 && (
                <>
                  <div className="section-title">More Chunks</div>
                  <div className="three-col">
                    {otherChunks.map((chunk) => (
                      <ChunkCard key={chunk.text + chunk.start} chunk={chunk} isSelected={selectedChunk?.text === chunk.text} onSelect={setSelectedChunk} onMakeFlashcard={handleMakeFlashcard} making={makingFlashcard === chunk.text} saved={savedChunks.has(chunk.text)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── Saved videos ───────────────────────────────────────────────────── */}
      {savedVideos.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 40 }}>Saved Videos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
            {savedVideos.map((v) => (
              <div
                key={v.video_id}
                style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', cursor: 'pointer' }} onClick={() => handleLoadVideo(v.url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 160ms ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.35)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)' }}
                  >
                    <span style={{ fontSize: '2rem', color: '#fff', opacity: 0, transition: 'opacity 160ms ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.opacity = '1' }}
                    >▶</span>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 800, fontSize: '0.88rem', lineHeight: 1.3 }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                    <button
                      onClick={() => handleLoadVideo(v.url)}
                      className="btn-primary"
                      style={{ flex: 1, fontSize: '0.76rem', padding: '6px 10px' }}
                    >
                      Study
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(v.video_id)}
                      style={{ border: '1.5px solid var(--line)', borderRadius: 999, padding: '6px 12px', background: '#fff', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
