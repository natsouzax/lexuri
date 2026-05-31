import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
