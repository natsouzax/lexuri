import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'
import DonationPopup from '@/components/DonationPopup'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <AppShell>
      {children}
      <DonationPopup />
    </AppShell>
  )
}
