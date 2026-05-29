'use client'

import { useState } from 'react'
import Hero from '@/components/ui/Hero'
import GeneratedLearningCard from '@/components/ui/GeneratedLearningCard'
import type { Flashcard, SongData } from '@/lib/types'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

export default function MusicPage() {
  const [query, setQuery] = useState('')
  const [song, setSong] = useState<SongData | null>(null)
  const [searching, setSearching] = useState(false)

  const [hardWords, setHardWords] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)

  const [cardMap, setCardMap] = useState<Record<string, Flashcard>>({})
  const [generatingWord, setGeneratingWord] = useState<string | null>(null)

  const [error, setError] = useState('')

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setSong(null)
    setHardWords([])
    setCardMap({})
    try {
      const data = await apiFetch<SongData>(`/api/genius/search?q=${encodeURIComponent(query)}`)
      setSong(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setSearching(false)
    }
  }

  async function handleExtractWords() {
    if (!song?.lyrics) return
    setExtracting(true)
    try {
      const words = await apiFetch<string[]>('/api/llm/hard-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: song.lyrics }),
      })
      setHardWords(words)
    } catch (e) {
      setError(String(e))
    } finally {
      setExtracting(false)
    }
  }

  async function handleMakeCard(word: string) {
    setGeneratingWord(word)
    try {
      const card = await apiFetch<Flashcard>('/api/llm/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      })
      await apiFetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: [card] }),
      })
      setCardMap((prev) => ({ ...prev, [word]: card }))
    } catch (e) {
      setError(String(e))
    } finally {
      setGeneratingWord(null)
    }
  }

  return (
    <>
      <Hero
        title="Music Lab"
        subtitle="Turn lyrics into language you can actually use."
        body="Search for a song, pull out challenging vocabulary, and create flashcards from the words that stick in your ear."
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
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>Read lyrics</summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
                  {song.lyrics}
                </pre>
              </details>
              <button className="btn-primary btn-wide" onClick={handleExtractWords} disabled={extracting}>
                {extracting ? <><span className="spinner" />Finding words…</> : 'Generate vocabulary from lyrics'}
              </button>
            </>
          )}
        </>
      )}

      {hardWords.length > 0 && (
        <>
          <div className="section-title">Difficult Words</div>
          <div className="three-col">
            {hardWords.map((word) => (
              <div key={word} style={{ border: '1px solid var(--line)', borderRadius: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 10 }}>{word}</div>
                {cardMap[word] ? (
                  <GeneratedLearningCard card={cardMap[word]} />
                ) : (
                  <button
                    className="btn-primary btn-wide"
                    onClick={() => handleMakeCard(word)}
                    disabled={generatingWord === word}
                  >
                    {generatingWord === word ? <><span className="spinner" />Making…</> : 'Make card'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!song && !searching && (
        <div className="alert-info">
          Search a song to turn lyrics into vocabulary practice.
        </div>
      )}
    </>
  )
}
