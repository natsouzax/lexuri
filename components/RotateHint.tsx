'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'lexuri_rotate_hint_dismissed'

export default function RotateHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function shouldShow(): boolean {
      if (sessionStorage.getItem(STORAGE_KEY)) return false
      return window.innerWidth <= 768 && window.innerHeight > window.innerWidth
    }

    const timer = setTimeout(() => {
      if (shouldShow()) setVisible(true)
    }, 500)

    function handleResize() {
      if (window.innerWidth > window.innerHeight) setVisible(false)
    }

    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="rotate-hint-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Rotate your device for the best experience"
    >
      <div className="rotate-hint-card">
        <div className="rotate-hint-phone" aria-hidden="true">
          <svg width="52" height="84" viewBox="0 0 52 84" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="48" height="80" rx="9" fill="var(--ink)" />
            <rect x="8" y="10" width="36" height="58" rx="3" fill="var(--paper)" />
            <circle cx="26" cy="76" r="3" fill="var(--muted)" />
            <rect x="18" y="4.5" width="16" height="2.5" rx="1.25" fill="var(--muted)" />
          </svg>
        </div>
        <h2 className="rotate-hint-title">Better in landscape</h2>
        <p className="rotate-hint-body">
          Turn your phone sideways for the full Lexuri experience
        </p>
        <button className="rotate-hint-btn" onClick={dismiss}>
          Got it
        </button>
      </div>
    </div>
  )
}
