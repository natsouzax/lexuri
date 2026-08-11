'use client'

import { useMemo, useState } from 'react'
import { playSuccess, playSoft, playFanfare } from '@/lib/sfx'
import ConfettiBurst from '@/components/ui/ConfettiBurst'
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
        playSuccess()
      } else {
        setMisses((m) => m + 1)
        playSoft()
        setTimeout(() => setFlipped([]), 900)
      }
    }
  }

  return (
    <div className="review-stack-wide">
      <div className="review-progress">
        {matched.size / 2} {t('act.of')} {tiles.length / 2} {t('act.pairs')} · {misses} {t('act.mistakes')}
      </div>

      <div className="memory-grid">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.key)
          const isUp = flipped.includes(tile.key) || isMatched
          return (
            <button
              key={tile.key}
              type="button"
              className={`memory-tile${isMatched ? ' is-matched' : isUp ? ' is-up' : ''}`}
              onClick={() => handleFlip(tile)}
              disabled={isMatched}
            >
              {isUp ? tile.label : '?'}
            </button>
          )
        })}
      </div>

      {allMatched && (
        <div className="memory-done">
          <ConfettiBurst />
          <p className="memory-done-title">{t('act.allPairs')}</p>
          <div className="review-actions">
            <button className="btn-primary" onClick={() => { playFanfare(); onDone() }} disabled={finishing}>
              {finishing ? <><span className="spinner" /> {t('act.saving')}</> : t('act.finishDay2')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
