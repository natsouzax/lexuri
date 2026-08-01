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

// Toda página cujo hero é `.app-hero.promo-banner` precisa estar aqui, senão o
// gradiente para na borda da sidebar em vez de correr por trás dela.
const FULL_BLEED_HERO_ROUTES = new Set(['/dashboard', '/feed', '/albums', '/review', '/speaking-review', '/flashcards', '/my-song', '/leaderboard', '/achievements'])

// A tela de uma música (/feed/<id>) tem hero como as demais, mas é rota
// dinâmica — não dá pra listar no Set acima.
function hasFullBleedHero(pathname: string) {
  return FULL_BLEED_HERO_ROUTES.has(pathname) || /^\/feed\/[^/]+$/.test(pathname)
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const overview = isOverview(pathname)
  const fullBleedHero = hasFullBleedHero(pathname)
  const [sidebarOpen, setSidebarOpen] = useState(() => overview)
  const scrollHidden = useHideOnScroll()

  // Sidebar defaults open only on Overview — every other page starts closed.
  // The layout persists across client-side navigation, so this has to react
  // to route changes rather than just the initial mount.
  useEffect(() => {
    setSidebarOpen(isOverview(pathname))
  }, [pathname])

  return (
    <div className={`app-shell${fullBleedHero ? ` hero-bleed-shell${sidebarOpen ? ' hero-bleed-sidebar-open' : ''}` : ''}`}>
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
