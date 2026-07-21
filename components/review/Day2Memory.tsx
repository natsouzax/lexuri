'use client'

import { useMemo, useState } from 'react'
import type { Flashcard } from '@/lib/types'
import { useLang } from '@/lib/i18n'

interface Props {
  cards: Flashcard[]
  onDone: () => void
  finishing: boolean
}

interface Tile {
  key: string
  pairId: string
  label: string
  kind: 'word' | 'translation'
}

const MAX_PAIRS = 6

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Day 2: jogo da memória — parear palavra ↔ tradução das palavras salvas.
export default function Day2Memory({ cards, onDone, finishing }: Props) {
  const { t } = useLang()
  const tiles = useMemo<Tile[]>(() => {
    const pairs = shuffle(cards.filter((c) => c.translation)).slice(0, MAX_PAIRS)
    return shuffle(
      pairs.flatMap((c) => [
        { key: c.id + ':w', pairId: c.id, label: c.word, kind: 'word' as const },
        { key: c.id + ':t', pairId: c.id, label: c.translation, kind: 'translation' as const },
      ]),
    )
  }, [cards])

  const [flipped, setFlipped] = useState<string[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [misses, setMisses] = useState(0)

  const allMatched = tiles.length > 0 && matched.size === tiles.length

  function handleFlip(tile: Tile) {
    if (matched.has(tile.key) || flipped.includes(tile.key) || flipped.length === 2) return
    const next = [...flipped, tile.key]
    setFlipped(next)
    if (next.length === 2) {
      const [a, b] = next.map((k) => tiles.find((t) => t.key === k)!)
      if (a.pairId === b.pairId && a.kind !== b.kind) {
        setMatched((prev) => new Set([...prev, a.key, b.key]))
        setFlipped([])
      } else {
        setMisses((m) => m + 1)
        setTimeout(() => setFlipped([]), 900)
      }
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 16 }}>
        {matched.size / 2} {t('act.of')} {tiles.length / 2} {t('act.pairs')} · {misses} {t('act.mistakes')}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {tiles.map((tile) => {
          const isUp = flipped.includes(tile.key) || matched.has(tile.key)
          const isMatched = matched.has(tile.key)
          return (
            <button
              key={tile.key}
              onClick={() => handleFlip(tile)}
              disabled={isMatched}
              style={{
                minHeight: 72,
                borderRadius: 12,
                border: `1.5px solid ${isMatched ? 'var(--moss)' : isUp ? 'var(--clay)' : 'var(--line)'}`,
                background: isMatched ? 'rgba(70,98,74,0.1)' : isUp ? '#fff' : 'var(--sage)',
                color: isMatched ? 'var(--moss)' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isMatched ? 'default' : 'pointer',
                padding: '8px 10px',
                transition: 'all 160ms ease',
              }}
            >
              {isUp ? tile.label : '?'}
            </button>
          )
        })}
      </div>

      {allMatched && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.15rem', marginBottom: 12 }}>
            {t('act.allPairs')}
          </p>
          <button className="btn-primary" onClick={onDone} disabled={finishing} style={{ padding: '10px 28px' }}>
            {finishing ? <><span className="spinner" /> {t('act.saving')}</> : t('act.finishDay2')}
          </button>
        </div>
      )}
    </div>
  )
}
