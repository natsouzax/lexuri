import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import AppChrome from '@/components/AppChrome'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return <AppChrome>{children}</AppChrome>
}
