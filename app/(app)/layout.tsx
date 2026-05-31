import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobileHeader from '@/components/MobileHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-body">
        <MobileHeader />
        <main className="main-content">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
