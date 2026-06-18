'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/ui/Hero'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import { getFeedItem, getLevelColor } from '@/lib/feed'
import { saveItem, unsaveItem, isItemSaved } from '@/lib/storage/local'
import { chunkToFlashcard } from '@/lib/types'
import type { ChunkItem, Flashcard, TranscriptSegment } from '@/lib/types'

const LEVELS = ['A2', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

interface LessonData {
  video_id: string
  title: string
  transcript: string
  segments: TranscriptSegment[]
  original_text: string
  chunks: ChunkItem[]
}

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
  const [saved, setSaved]                         = useState(false)
  const [lesson, setLesson]                       = useState<LessonData | null>(null)
  const [loading, setLoading]                     = useState(false)
  const [loadError, setLoadError]                 = useState('')

  const [selectedWords, setSelectedWords]         = useState<string[]>([])
  const [generatedCards, setGeneratedCards]       = useState<Flashcard[]>([])
  const [generatingCards, setGeneratingCards]     = useState(false)

  const [level, setLevel]                         = useState<Level>('B1')
  const [chunksLoading, setChunksLoading]         = useState(false)
  const [selectedChunk, setSelectedChunk]         = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks]             = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard]     = useState<string | null>(null)
  const [error, setError]                         = useState('')

  useEffect(() => { setSaved(isItemSaved(id)) }, [id])

  useEffect(() => {
    if (!localStorage.getItem('lexuri_welcome_dismissed')) {
      setShowWelcomeBanner(true)
    }
  }, [])

  // Load full lesson (transcript + chunks) from cache-backed endpoint
  const loadLesson = useCallback(async (lvl: Level, isLevelChange = false) => {
    if (!item) return
    if (isLevelChange) {
      setChunksLoading(true)
    } else {
      setLoading(true)
      setLoadError('')
    }
    setSelectedChunk(null)
    setError('')
    try {
      const data = await apiFetch<LessonData>(`/api/feed/${id}/lesson?level=${lvl}`)
      setLesson(data)
    } catch (e) {
      if (isLevelChange) {
        setError(String(e))
      } else {
        setLoadError(String(e))
      }
    } finally {
      setLoading(false)
      setChunksLoading(false)
    }
  }, [item, id])

  // Initial load
  useEffect(() => { loadLesson(level) }, [loadLesson]) // eslint-disable-line react-hooks/exhaustive-deps

  // Level change — only re-fetch chunks (transcript stays the same)
  function handleLevelChange(lvl: Level) {
    setLevel(lvl)
    loadLesson(lvl, true)
  }

  function handleToggleSave() {
    if (saved) { unsaveItem(id); setSaved(false) }
    else       { saveItem(id);   setSaved(true)  }
  }

  async function handleGenerateFlashcards() {
    if (!selectedWords.length || !lesson) return
    setGeneratingCards(true)
    setError('')
    try {
      const timestamps: Record<string, number | null> = {}
      for (const word of selectedWords) {
        const seg = lesson.segments.find((s) =>
          (s.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).some((w) => w.toLowerCase() === word),
        )
        timestamps[word] = seg?.start ?? null
      }
      const cards = await apiFetch<Flashcard[]>('/api/llm/flashcards-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: selectedWords, source_video: lesson.video_id, timestamps }),
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

  async function handleMakeFlashcard(chunk: ChunkItem) {
    if (!lesson) return
    setMakingFlashcard(chunk.text)
    setError('')
    try {
      const card = chunkToFlashcard(chunk, lesson.original_text)
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
  const highChunks  = lesson?.chunks.filter((c) => c.importance === 'high') ?? []
  const otherChunks = lesson?.chunks.filter((c) => c.importance !== 'high') ?? []

  return (
    <>
      {showWelcomeBanner && (
        <div style={{ background: 'linear-gradient(135deg, rgba(70,98,74,0.12) 0%, rgba(70,98,74,0.06) 100%)', border: '1px solid rgba(70,98,74,0.3)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--moss)', fontWeight: 600 }}>
            Welcome. AI is mapping the chunks for you — save three useful expressions to get started.
          </span>
          <button onClick={() => { localStorage.setItem('lexuri_welcome_dismissed', 'true'); setShowWelcomeBanner(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1, padding: '0 4px', flexShrink: 0 }} aria-label="Fechar">×</button>
        </div>
      )}

      <Hero title={item.title} subtitle={item.channel ?? item.artist ?? ''} body={item.preview} />

      {/* Maintenance notice */}
      {item.maintenance && (
        <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.86rem', color: '#92400e', fontWeight: 600 }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
          <span>This lesson is currently under maintenance. The transcript or captions may be missing, out of sync, or in the wrong language. We are working on a fix.</span>
        </div>
      )}

      {/* Back + meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/feed" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>Back to Feed</Link>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '2px 10px', borderRadius: 999, background: levelColor, color: '#fff' }}>{item.level}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{item.duration}</span>
        {item.tags.map((tag) => (
          <span key={tag} style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--sage)', color: 'var(--moss)' }}>{tag}</span>
        ))}
        <button onClick={handleToggleSave} style={{ marginLeft: 'auto', border: `1.5px solid ${saved ? 'var(--clay)' : 'var(--line)'}`, borderRadius: 999, padding: '6px 16px', background: saved ? 'rgba(200,111,74,0.1)' : '#fff', color: saved ? 'var(--clay)' : 'var(--muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: 'var(--muted)' }}>
          <span className="spinner" />
          <span>Loading lesson…</span>
        </div>
      )}

      {loadError && (
        <div>
          <div className="alert-error">{loadError}</div>
          <button className="btn-secondary" onClick={() => loadLesson(level)} style={{ marginTop: 8 }}>Retry</button>
        </div>
      )}

      {lesson && (
        <>
          <div className="section-title">Lesson Workspace</div>

          {/* Controls row */}
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 6 }}>{lesson.title}</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: 0 }}>
                Play the video, read the transcript, then let AI surface the expressions worth saving.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)' }}>My level:</span>
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => handleLevelChange(l)} style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${level === l ? 'var(--clay)' : 'var(--line)'}`, background: level === l ? 'var(--clay)' : 'transparent', color: level === l ? '#fff' : 'var(--muted)', fontWeight: level === l ? 700 : 400, fontSize: '0.78rem', cursor: 'pointer' }}>
                    {l}
                  </button>
                ))}
              </div>
              {chunksLoading && (
                <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" />Finding essential chunks…
                </div>
              )}
            </div>
          </div>

          {/* Synced player */}
          <div className="section-title">Synced Video Transcript</div>
          <YoutubeSyncPlayer
            videoId={lesson.video_id}
            segments={lesson.segments}
            selectedWords={selectedWords}
            onWordsChange={setSelectedWords}
            chunks={lesson.chunks}
            selectedChunk={selectedChunk}
            onChunkSelect={setSelectedChunk}
          />

          {/* Word collector */}
          {selectedWords.length > 0 && (
            <>
              <div className="section-title">Vocabulary Collector</div>
              <div className="chip-list">
                {selectedWords.map((word) => (
                  <button key={word} className="chip" onClick={() => setSelectedWords((prev) => prev.filter((w) => w !== word))}>
                    {word} ×
                  </button>
                ))}
              </div>
              <button className="btn-primary btn-wide" onClick={handleGenerateFlashcards} disabled={generatingCards}>
                {generatingCards ? <><span className="spinner" />Generating flashcards...</> : 'Generate flashcards'}
              </button>
            </>
          )}

          {error && <div className="alert-error">{error}</div>}

          {/* Generated flashcards */}
          {generatedCards.length > 0 && (
            <>
              <div className="section-title">
                Generated Flashcards
                <Link href="/review" style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: 'var(--moss)', textDecoration: 'none' }}>Go to Review</Link>
              </div>
              {generatedCards.map((card) => <GeneratedLearningCard key={card.id} card={card} />)}
            </>
          )}

          {/* Chunk analysis */}
          {lesson.chunks.length > 0 && !chunksLoading && (
            <>
              <div className="panel" style={{ marginBottom: 16 }}>
                <span className="mini-label">AI chunk map ready</span>
                <p className="panel-copy">
                  Lexuri found {lesson.chunks.length} natural expressions. Save the high-importance chunks first.
                </p>
              </div>
              <div className="section-title">Chunk Map</div>
              <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
                <ChunkHighlighter
                  text={lesson.original_text}
                  chunks={lesson.chunks}
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
                  .filter(({ type }) => lesson.chunks.some((c) => c.type === type))
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
    </>
  )
}
