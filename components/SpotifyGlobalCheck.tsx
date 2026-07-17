'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import SpotifyConnectModal from './SpotifyConnectModal'

// Shown once per browser session if the user isn't connected to Spotify.
// Skipped on auth-related pages and on pages that have their own Spotify flow.
const SKIP_PATHS = ['/login', '/signup', '/api/', '/spotify', '/settings', '/onboarding']

export default function SpotifyGlobalCheck() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show on auth/settings pages
    if (SKIP_PATHS.some(p => pathname.startsWith(p))) return
    // Show at most once per session
    if (sessionStorage.getItem('spotify_modal_dismissed')) return

    fetch('/api/spotify/status')
      .then(r => r.json())
      .then((d: { connected: boolean }) => {
        if (!d.connected) setShow(true)
      })
      .catch(() => {})
  }, [pathname])

  if (!show) return null

  return (
    <SpotifyConnectModal
      returnTo={pathname}
      onClose={() => {
        setShow(false)
        sessionStorage.setItem('spotify_modal_dismissed', '1')
      }}
    />
  )
}
