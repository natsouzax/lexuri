'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import AppTopNav from './AppTopNav'
import Sidebar from './Sidebar'
import FloatingTranslator from './FloatingTranslator'
import { MarketingFooter } from './marketing/MarketingChrome'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'

function isOverview(pathname: string) {
  return pathname.startsWith('/dashboard')
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(() => isOverview(pathname))
  const scrollHidden = useHideOnScroll()

  // Sidebar defaults open only on Overview — every other page starts closed.
  // The layout persists across client-side navigation, so this has to react
  // to route changes rather than just the initial mount.
  useEffect(() => {
    setSidebarOpen(isOverview(pathname))
  }, [pathname])

  return (
    <div className="app-shell">
      <AppTopNav sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(v => !v)} hidden={scrollHidden} />
      <div className="app-body">
        <motion.div
          className={`sidebar-wrap${sidebarOpen ? '' : ' closed'}`}
          animate={{ x: scrollHidden ? -260 : 0, opacity: scrollHidden ? 0 : 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Sidebar />
        </motion.div>
        <main className="main-content">
          {children}
        </main>
      </div>
      <MarketingFooter />
      <FloatingTranslator />
    </div>
  )
}
