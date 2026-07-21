'use client'

import AppShell from './AppShell'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
