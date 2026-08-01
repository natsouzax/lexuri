'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import ChunkCard from '@/components/ui/ChunkCard'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import {
  CardsIcon,
  CheckCircleIcon,
  ChevronIcon,
  CloseIcon,
  LevelIcon,
  MusicNoteIcon,
  SyncIcon,
} from '@/components/ui/Icons'
import { getFeedItem, getLevelColor } from '@/lib/feed'
import { chunkToFlashcard } from '@/lib/types'
import { awardXP } from '@/lib/xp'
import type { ChunkItem, Flashcard, TranscriptSegment } from '@/lib/types'
import { useLang } from '@/lib/i18n'

// Mesmas cores usadas no prompt de análise (lib/chunks.ts COLOR CODES).
const CHUNK_TYPES = [
  { type: 'phrasal_verb',    label: 'Phrasal Verb',    color: '#4CAF50' },
  { type: 'idiomatic',       label: 'Idiom',           color: '#FF6B6B' },
  { type: 'collocation',     label: 'Collocation',     color: '#4A90E2' },
  { type: 'lexical_chunk',   label: 'Lexical Chunk',   color: '#9C27B0' },
  { type: 'formulaic',       label: 'Formulaic',       color: '#FF9800' },
  { type: 'grammar_pattern', label: 'Grammar Pattern', color: '#00BCD4' },
  { type: 'emotional',       label: 'Emotional',       color: '#E91E63' },
  { type: 'conversational',  label: 'Conversational',  color: '#607D8B' },
] as const

// item.level é CEFR (A1…C2); LevelIcon fala a linguagem de STUDY_LEVELS.
function studyLevelFor(cefr: string): 'beginner' | 'intermediate' | 'advanced' {
  if (cefr.startsWith('A')) return 'beginner'
  if (cefr.startsWith('B')) return 'intermediate'
  return 'advanced'
}

export interface LessonData {
  video_id: string
  title: string
  transcript: string
  segments: TranscriptSegment[]
  original_text: string
  chunks: ChunkItem[]
}

interface Props {
  feedItemId?: string
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

// Tela única de música do MVP: ouvir com letra sincronizada, tocar em
// qualquer palavra/chunk pra traduzir e salvar na biblioteca, e ao final
// começar o ciclo de revisão (Day 1).
export default function LessonView({ feedItemId: propId }: Props) {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useLang()
  const id = propId ?? params.id
  const item = getFeedItem(id)

  const [lesson, setLesson]       = useState<LessonData | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadError, setLoadError] = useState('')

  const [selectedChunk, setSelectedChunk]     = useState<ChunkItem | null>(null)
  const [savedChunks, setSavedChunks]         = useState<Set<string>>(new Set())
  const [makingFlashcard, setMakingFlashcard] = useState<string | null>(null)
  const [generatedCards, setGeneratedCards]   = useState<Flashcard[]>([])
  const [cardsExpanded, setCardsExpanded]     = useState(false)
  const [lyricsOpen, setLyricsOpen]           = useState(true)
  const [typeFilter, setTypeFilter]           = useState<string | null>(null)
  const [error, setError]                     = useState('')
  const [finishing, setFinishing]             = useState(false)
  const [resyncing, setResyncing]             = useState(false)
  const [resyncMsg, setResyncMsg]             = useState<{ ok: boolean; text: string } | null>(null)

  const loadLesson = useCallback(async () => {
    if (!item) return
    setLoading(true)
    setLoadError('')
    setSelectedChunk(null)
    setError('')
    try {
      const data = await apiFetch<LessonData>(`/api/feed/${id}/lesson`)
      setLesson(data)
    } catch (e) {
      setLoadError(String(e))
    } finally {
      setLoading(false)
    }
  }, [item, id])

  useEffect(() => { loadLesson() }, [loadLesson])

  // Marca a música como ouvida assim que a lição abre (métrica de engajamento).
  useEffect(() => {
    if (!lesson) return
    apiFetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: id, action: 'listened' }),
    }).catch(() => {})
    awardXP('music_studied')
  }, [lesson, id])

  function handleWordSaved(card: Flashcard) {
    setGeneratedCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)])
  }

  async function handleMakeFlashcard(chunk: ChunkItem) {
    if (!lesson) return
    setMakingFlashcard(chunk.text)
    setError('')
    try {
      const card = chunkToFlashcard(chunk, lesson.original_text, lesson.video_id)
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setSavedChunks((prev) => new Set(prev).add(chunk.text))
      setGeneratedCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)])
      awardXP('chunk_saved')
    } catch (e) {
      setError(String(e))
    } finally {
      setMakingFlashcard(null)
    }
  }

  async function handleFinish() {
    setFinishing(true)
    router.push(`/review/${id}`)
  }

  // Só funciona rodando `npm run dev` local — raspa o YouTube de novo com o
  // IP residencial de quem está rodando e regrava o arquivo da lição.
  async function handleResync() {
    setResyncing(true)
    setResyncMsg(null)
    try {
      const res = await apiFetch<{ segments: number; chunks: number }>('/api/admin/resync-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId: id }),
      })
      setResyncMsg({ ok: true, text: `Updated — ${res.segments} lines, ${res.chunks} chunks. Reload the page.` })
    } catch (e) {
      setResyncMsg({ ok: false, text: String(e) })
    } finally {
      setResyncing(false)
    }
  }

  if (!item) {
    return (
      <div className="card lesson-state-card">
        <p className="lesson-state-title">{t('lesson.notFound')}</p>
        <div className="lesson-state-actions">
          <Link href="/feed" className="btn-secondary">{t('lesson.back')}</Link>
        </div>
      </div>
    )
  }

  const levelColor = getLevelColor(item.level)
  const allChunks = lesson?.chunks ?? []
  const visibleChunks = typeFilter ? allChunks.filter((c) => c.type === typeFilter) : allChunks
  // Repeated chorus lines expand to one ChunkItem per occurrence (so every
  // repeat is clickable in the lyrics) — dedupe by text for the summary
  // cards below so "Clap along if you feel like" doesn't show 4 times.
  const seenChunkText = new Set<string>()
  const highChunks = visibleChunks.filter((c) => {
    if (c.importance !== 'high') return false
    const key = c.text.toLowerCase()
    if (seenChunkText.has(key)) return false
    seenChunkText.add(key)
    return true
  })
  // O pill do topo descreve a música, então conta sobre allChunks — senão
  // o número cairia junto quando o usuário filtra por tipo de chunk.
  const keyExpressionCount = new Set(
    allChunks.filter((c) => c.importance === 'high').map((c) => c.text.toLowerCase()),
  ).size

  return (
    <>
      <div className="app-hero promo-banner">
        <span className="promo-sparkle promo-sparkle-1">✦</span>
        <span className="promo-sparkle promo-sparkle-2">✦</span>
        <span className="promo-sparkle promo-sparkle-3">✦</span>

        <div className="lesson-meta-row">
          <Link href="/feed" className="lesson-meta-chip">{t('lesson.back')}</Link>
          <span className="lesson-meta-chip is-level" style={{ background: levelColor }}>{item.level}</span>
          <span className="lesson-meta-chip is-muted">{item.duration}</span>
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={handleResync}
              disabled={resyncing}
              title="Re-scrapes YouTube with the local IP and rewrites the lesson file — dev only (npm run dev)"
              className="lesson-meta-chip lesson-meta-dev"
            >
              {resyncing ? <><span className="spinner" /> Syncing…</> : <><SyncIcon size={13} /> Sync (local)</>}
            </button>
          )}
        </div>

        <h1 className="app-hero-title">{item.title}</h1>
        <p className="app-hero-subtitle">{item.artist ?? item.channel ?? ''}</p>
      </div>

      <div className="stat-pill-row">
        <div className="stat-pill">
          <span className="stat-pill-icon clay"><LevelIcon level={studyLevelFor(item.level)} size={17} /></span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{item.level}</span>
            <span className="stat-pill-label">Song level</span>
          </span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-icon butter"><CardsIcon size={17} /></span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{generatedCards.length} saved</span>
            <span className="stat-pill-label">Words in your library</span>
          </span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}><MusicNoteIcon size={17} /></span>
          <span className="stat-pill-text">
            <span className="stat-pill-value">{keyExpressionCount} expressions</span>
            <span className="stat-pill-label">Key phrases in this song</span>
          </span>
        </div>
      </div>

      {resyncMsg && (
        <div className={resyncMsg.ok ? 'alert-info' : 'alert-error'} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {resyncMsg.ok && <CheckCircleIcon size={16} />}
          <span>{resyncMsg.text}</span>
        </div>
      )}

      {loading && (
        <div className="lesson-loading">
          <span className="spinner" />
          <span>{t('lesson.loading')}</span>
        </div>
      )}

      {loadError && (
        <div className="card lesson-state-card">
          <p className="lesson-state-title">{t('lesson.loadError')}</p>
          <div className="lesson-state-actions">
            <button className="btn-secondary" onClick={loadLesson}>{t('lesson.retry')}</button>
          </div>
        </div>
      )}

      {lesson && (
        <>
          <div className="panel" style={{ marginBottom: 16 }}>
            <span className="mini-label">{t('lesson.how.label')}</span>
            <p className="panel-copy">{t('lesson.how.body')}</p>
          </div>

          <YoutubeSyncPlayer
            videoId={lesson.video_id}
            segments={lesson.segments}
            chunks={lesson.chunks}
            selectedChunk={selectedChunk}
            onChunkSelect={setSelectedChunk}
            onWordSaved={handleWordSaved}
          />

          {error && <div className="alert-error">{error}</div>}

          <div className="section-title">
            {t('lesson.interactiveLyrics')}
            <button
              type="button"
              className="lesson-toggle"
              onClick={() => setLyricsOpen((v) => !v)}
              aria-expanded={lyricsOpen}
              aria-label={lyricsOpen ? 'Collapse lyrics' : 'Expand lyrics'}
            >
              <ChevronIcon direction={lyricsOpen ? 'up' : 'down'} size={16} />
            </button>
          </div>
          {lyricsOpen && (
            <div className="lesson-lyrics-panel">
              <ChunkHighlighter
                text={lesson.original_text}
                chunks={visibleChunks}
                selectedChunk={selectedChunk}
                onChunkClick={setSelectedChunk}
                videoId={lesson.video_id}
                onWordSaved={handleWordSaved}
              />
            </div>
          )}

          {allChunks.length > 0 && (
            <div className="lesson-chunk-filters">
              {CHUNK_TYPES
                .filter(({ type }) => allChunks.some((c) => c.type === type))
                .map(({ type, label, color }) => {
                  const active = typeFilter === type
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`lesson-chunk-chip${active ? ' active' : ''}`}
                      style={{ '--chip': color } as React.CSSProperties}
                      aria-pressed={active}
                      onClick={() => setTypeFilter(active ? null : type)}
                    >
                      {label}
                    </button>
                  )
                })}
              {typeFilter && (
                <button
                  type="button"
                  className="lesson-chunk-chip is-clear"
                  onClick={() => setTypeFilter(null)}
                >
                  <CloseIcon size={12} /> Clear filter
                </button>
              )}
            </div>
          )}

          {generatedCards.length > 0 && (
            <>
              <div className="section-title">
                {t('lesson.savedWords')} ({generatedCards.length})
                <Link href="/review" style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: 'var(--moss)', textDecoration: 'none' }}>{t('nav.review')} →</Link>
              </div>
              {/* Só a primeira fica aberta; as demais escondidas atrás de um toggle. */}
              {(cardsExpanded ? generatedCards : generatedCards.slice(0, 1)).map((card) => (
                <GeneratedLearningCard key={card.id} card={card} />
              ))}
              {generatedCards.length > 1 && (
                <button
                  type="button"
                  className="lesson-toggle lesson-toggle-wide"
                  onClick={() => setCardsExpanded((v) => !v)}
                  aria-expanded={cardsExpanded}
                >
                  <ChevronIcon direction={cardsExpanded ? 'up' : 'down'} size={14} />
                  {cardsExpanded ? 'Show less' : `Show ${generatedCards.length - 1} more`}
                </button>
              )}
            </>
          )}

          {highChunks.length > 0 && (
            <>
              <div className="section-title">{t('lesson.keyExpressions')}</div>
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

          <div className="panel lesson-finish-panel">
            <p className="lesson-finish-title">
              {generatedCards.length > 0
                ? `${generatedCards.length} ${generatedCards.length === 1 ? t('lesson.savedOne') : t('lesson.savedCount')}`
                : t('lesson.saveSome')}
            </p>
            <p className="panel-copy" style={{ marginBottom: 16 }}>{t('lesson.finishHint')}</p>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={finishing}
            >
              {finishing ? <><span className="spinner" /> {t('lesson.going')}</> : t('lesson.finishCta')}
            </button>
          </div>
        </>
      )}
    </>
  )
}
