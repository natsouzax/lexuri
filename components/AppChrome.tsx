'use client'

import { usePathname } from 'next/navigation'
import AppShell from './AppShell'
import PremiumPopup from './PremiumPopup'
import SpotifyGlobalCheck from './SpotifyGlobalCheck'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isOnboarding = pathname.startsWith('/onboarding')

  if (isOnboarding) return <>{children}</>

  return (
    <AppShell>
      {children}
      <PremiumPopup />
      <SpotifyGlobalCheck />
    </AppShell>
  )
}
