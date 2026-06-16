'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'lexuri_premium_popup_shown'

export default function PremiumPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const alreadyShown = localStorage.getItem(STORAGE_KEY)
      if (!alreadyShown) {
        const timer = setTimeout(() => setVisible(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage may be unavailable in private mode
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Go Premium"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: '24px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          padding: '24px 24px 20px',
          maxWidth: 320,
          width: '100%',
          pointerEvents: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: 'var(--muted)',
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        <p style={{ fontSize: '1.3rem', marginBottom: 6 }}>⚡</p>
        <h3
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 900,
            fontSize: '1.05rem',
            marginBottom: 8,
          }}
        >
          Go Premium — 1 month free
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: 18 }}>
          Unlock unlimited content, advanced AI chunk detection, and automated SRS scheduling.
          Use coupon <strong>LEARN</strong> — no credit card required.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/plans#coupon"
            onClick={dismiss}
            style={{
              flex: 1,
              display: 'inline-block',
              background: 'var(--clay)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Activate Premium ⚡
          </Link>
          <button
            onClick={dismiss}
            style={{
              flex: 1,
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 10,
              fontSize: '0.85rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '10px 16px',
              fontWeight: 700,
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
