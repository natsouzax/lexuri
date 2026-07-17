'use client'

import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isOnboarding = pathname.startsWith('/onboarding')

  if (isOnboarding) return <>{children}</>

  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
