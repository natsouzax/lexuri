'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import YoutubeSyncPlayer from '@/components/YoutubeSyncPlayer'
import ChunkCard from '@/components/ui/ChunkCard'
import { getFeedItem, getLevelColor } from '@/lib/feed'
import { chunkToFlashcard } from '@/lib/types'
import type { ChunkItem, Flashcard, TranscriptSegment } from '@/lib/types'
import { useLang } from '@/lib/i18n'

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
  const [savedCount, setSavedCount]           = useState(0)
  const [error, setError]                     = useState('')
  const [finishing, setFinishing]             = useState(false)
  const [resyncing, setResyncing]             = useState(false)
  const [resyncMsg, setResyncMsg]             = useState('')

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
  }, [lesson, id])

  function handleWordSaved(_card: Flashcard) {
    setSavedCount((n) => n + 1)
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
      setSavedCount((n) => n + 1)
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
    setResyncMsg('')
    try {
      const res = await apiFetch<{ segments: number; chunks: number }>('/api/admin/resync-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedItemId: id }),
      })
      setResyncMsg(`✅ Atualizado — ${res.segments} falas, ${res.chunks} chunks. Recarregue a página.`)
    } catch (e) {
      setResyncMsg(`❌ ${String(e)}`)
    } finally {
      setResyncing(false)
    }
  }

  if (!item) {
    return (
      <div style={{ padding: 48 }}>
        <div className="alert-error">{t('lesson.notFound')}</div>
        <Link href="/feed" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>{t('lesson.back')}</Link>
      </div>
    )
  }

  const levelColor = lesson ? getLevelColor(item.level) : 'var(--line)'
  const highChunks = (lesson?.chunks ?? []).filter((c) => c.importance === 'high')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/feed" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none' }}>{t('lesson.back')}</Link>
        <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '2px 10px', borderRadius: 999, background: levelColor, color: '#fff' }}>{item.level}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{item.duration}</span>
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleResync}
            disabled={resyncing}
            title="Raspa o YouTube de novo com o IP local e regrava o arquivo da lição — só funciona rodando npm run dev"
            style={{ marginLeft: 'auto', border: '1.5px solid var(--line)', borderRadius: 999, padding: '6px 16px', background: '#fff', color: 'var(--muted)', fontWeight: 700, fontSize: '0.82rem', cursor: resyncing ? 'default' : 'pointer', opacity: resyncing ? 0.6 : 1 }}
          >
            {resyncing ? <><span className="spinner" /> Sincronizando…</> : '🔄 Sync (local)'}
          </button>
        )}
      </div>

      <div className="app-hero" style={{ marginBottom: 16 }}>
        <h1 className="app-hero-title">{item.title}</h1>
        <p className="app-hero-subtitle">{item.artist ?? item.channel ?? ''}</p>
      </div>

      {resyncMsg && <div className="alert-info" style={{ marginBottom: 16 }}>{resyncMsg}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: 'var(--muted)' }}>
          <span className="spinner" />
          <span>{t('lesson.loading')}</span>
        </div>
      )}

      {loadError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="alert-error">{t('lesson.loadError')}</div>
          <button className="btn-secondary" onClick={loadLesson}>{t('lesson.retry')}</button>
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

          <div className="panel" style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.1rem', marginBottom: 6 }}>
              {savedCount > 0
                ? `${savedCount} ${savedCount === 1 ? t('lesson.savedOne') : t('lesson.savedCount')}`
                : t('lesson.saveSome')}
            </p>
            <p className="panel-copy" style={{ marginBottom: 16 }}>{t('lesson.finishHint')}</p>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={finishing}
              style={{ padding: '12px 32px' }}
            >
              {finishing ? <><span className="spinner" /> {t('lesson.going')}</> : t('lesson.finishCta')}
            </button>
          </div>
        </>
      )}
    </>
  )
}
