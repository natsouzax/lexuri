'use client'

import { useState } from 'react'
import AppTopNav from './AppTopNav'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="app-shell">
      <AppTopNav sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(v => !v)} />
      <div className="app-body">
        <div className={`sidebar-wrap${sidebarOpen ? '' : ' closed'}`}>
          <Sidebar />
        </div>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
