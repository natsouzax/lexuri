'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XP_AWARDED_EVENT, type XPAwardDetail } from '@/lib/xp'

const LABELS: Record<XPAwardDetail['event'], string> = {
  flashcard_review: 'Card reviewed',
  chunk_analyzed: 'Expression analysed',
  chunk_saved: 'Expression saved',
  video_studied: 'Video studied',
  music_studied: 'Song explored',
  word_looked_up: 'Word learned',
  lesson_completed: 'Lesson completed',
  song_review_completed: 'Review step completed',
  takeaway_created: 'Glossary learning created',
  glossary_example_created: 'Personal example created',
  personal_song_created: 'Personal song created',
  personal_song_recorded: 'Performance saved',
  speaking_practiced: 'Speaking practised',
  album_review_completed: 'Album review completed',
  album_completed: 'Album completed',
  mission_complete: 'Mission completed',
}

export default function XPToast() {
  const [award, setAward] = useState<XPAwardDetail | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onAward(event: Event) {
      const detail = (event as CustomEvent<XPAwardDetail>).detail
      if (!detail?.points) return
      if (timerRef.current) clearTimeout(timerRef.current)
      setAward(detail)
      timerRef.current = setTimeout(() => setAward(null), 3200)
    }
    window.addEventListener(XP_AWARDED_EVENT, onAward)
    return () => {
      window.removeEventListener(XP_AWARDED_EVENT, onAward)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {award && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 360, damping: 25 }}
          style={{ position: 'fixed', top: 76, right: 20, zIndex: 1200, maxWidth: 'calc(100vw - 40px)', width: 280, borderRadius: 16, background: 'var(--ink)', color: '#fff', padding: '13px 15px', boxShadow: 'var(--shadow-lg)', display: 'flex', gap: 12, alignItems: 'center' }}
        >
          <span style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'var(--butter)', color: 'var(--ink)', fontWeight: 900 }}>
            +{award.points}
          </span>
          <span style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: '0.88rem' }}>{LABELS[award.event] ?? 'Progress saved'}</strong>
            <small style={{ display: 'block', opacity: 0.78, marginTop: 2 }}>
              {award.missionsCompleted?.length ? 'Daily mission completed · ' : ''}{award.newTotal.toLocaleString()} total XP
            </small>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

