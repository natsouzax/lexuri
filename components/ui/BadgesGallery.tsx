'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'
import { playTap } from '@/lib/sfx'

interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'review' | 'creation' | 'exploration'
  condition: string
}

const BADGES: BadgeDef[] = [
  // Streak
  { id: 'streak_1',   name: 'First Fire',       description: 'Keep a 1-day streak',       icon: '🔥', category: 'streak',      condition: 'Start a streak' },
  { id: 'streak_7',   name: 'Week Warrior',      description: '7-day streak',               icon: '🔥', category: 'streak',      condition: '7 days in a row' },
  { id: 'streak_30',  name: 'Monthly Flame',     description: '30-day streak',              icon: '🔥', category: 'streak',      condition: '30 days in a row' },
  { id: 'streak_100', name: 'Century Burn',      description: '100-day streak',             icon: '🔥', category: 'streak',      condition: '100 days in a row' },
  // Review
  { id: 'review_1',   name: 'First Review',      description: 'Complete your first review', icon: '↺', category: 'review',      condition: 'Review 1 card' },
  { id: 'review_10',  name: '10 Reviews',        description: 'Review 10 cards total',      icon: '↺', category: 'review',      condition: 'Review 10 cards' },
  { id: 'review_50',  name: '50 Reviews',        description: 'Review 50 cards total',      icon: '↺', category: 'review',      condition: 'Review 50 cards' },
  { id: 'review_100', name: 'Century Reviewer',  description: 'Review 100 cards total',     icon: '↺', category: 'review',      condition: 'Review 100 cards' },
  // Creation
  { id: 'save_1',     name: 'First Chunk',       description: 'Save your first chunk',      icon: '◈', category: 'creation',    condition: 'Save 1 chunk' },
  { id: 'save_10',    name: 'Chunk Collector',   description: 'Save 10 chunks',             icon: '◈', category: 'creation',    condition: 'Save 10 chunks' },
  { id: 'save_50',    name: 'Chunk Master',      description: 'Save 50 chunks',             icon: '◈', category: 'creation',    condition: 'Save 50 chunks' },
  // Exploration
  { id: 'youtube_1',  name: 'YouTube Explorer',  description: 'Study your first YouTube video', icon: '▶', category: 'exploration', condition: 'Study a YouTube video' },
  { id: 'music_1',    name: 'Music Lover',       description: 'Listen to your first song',      icon: '♪', category: 'exploration', condition: 'Open one song' },
  { id: 'music_5',    name: 'Audiophile',        description: 'Listen to 5 songs',             icon: '♪', category: 'exploration', condition: 'Open 5 songs' },
]

const CATEGORY_LABELS: Record<string, string> = {
  streak:      'Streak',
  review:      'Review',
  creation:    'Creation',
  exploration: 'Exploration',
}

interface Props {
  unlockedIds: string[]
  totalReviews?: number
  streak?: number
}

function Badge({ badge, unlocked, i }: { badge: BadgeDef; unlocked: boolean; i: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className={`badge-item${unlocked ? ' badge-item--unlocked' : ' badge-item--locked'}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.055 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <motion.div
        className="badge-icon"
        animate={unlocked ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.5, delay: 0.3 + i * 0.04, ease: 'easeInOut' }}
      >
        {badge.icon}
      </motion.div>
      <div className="badge-name">{badge.name}</div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            className="badge-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <strong>{badge.name}</strong>
            <span>{unlocked ? badge.description : `Para desbloquear: ${badge.condition}`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function BadgesGallery({ unlockedIds, totalReviews = 0, streak = 0 }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const derived = new Set(unlockedIds)
  if (streak >= 1)   derived.add('streak_1')
  if (streak >= 7)   derived.add('streak_7')
  if (streak >= 30)  derived.add('streak_30')
  if (streak >= 100) derived.add('streak_100')
  if (totalReviews >= 1)   derived.add('review_1')
  if (totalReviews >= 10)  derived.add('review_10')
  if (totalReviews >= 50)  derived.add('review_50')
  if (totalReviews >= 100) derived.add('review_100')

  const categories = ['all', 'streak', 'review', 'creation', 'exploration']
  const filtered = activeCategory === 'all' ? BADGES : BADGES.filter((b) => b.category === activeCategory)
  const unlockedCount = BADGES.filter((b) => derived.has(b.id)).length

  return (
    <div className="badges-gallery">
      {/* Header */}
      <div className="badges-header">
        <div>
          <div className="section-title" style={{ margin: 0 }}>Conquistas</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>
            {unlockedCount} / {BADGES.length} desbloqueados
          </div>
        </div>

        {/* Progress bar */}
        <div className="badges-progress">
          <div className="badges-progress-bar">
            <motion.div
              className="badges-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((unlockedCount / BADGES.length) * 100)}%` }}
              transition={{ duration: 1, delay: 0.3, ease: EASE_OUT }}
            />
          </div>
          <span>{Math.round((unlockedCount / BADGES.length) * 100)}%</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="badges-tabs">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            className={`badges-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => { playTap(); setActiveCategory(cat) }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <div className="badges-grid">
        {filtered.map((badge, i) => (
          <Badge key={badge.id} badge={badge} unlocked={derived.has(badge.id)} i={i} />
        ))}
      </div>
    </div>
  )
}
