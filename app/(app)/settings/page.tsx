import Link from 'next/link'
import { getUser } from '@/lib/supabase-server'

export default async function SettingsPage() {
  const user = await getUser()

  const SECTIONS = [
    { href: '/settings/profile',  icon: '👤', title: 'Profile',              desc: 'Update your name and avatar' },
    { href: '/settings/password', icon: '🔒', title: 'Password',             desc: 'Change your account password' },
    { href: '/settings/sessions', icon: '🖥',  title: 'Sessions',             desc: 'Manage active sessions' },
    { href: '/settings/delete',   icon: '⚠️',  title: 'Delete account',       desc: 'Permanently remove your data' },
  ]

  return (
    <>
      <div className="app-hero">
        <h1 className="app-hero-title">Settings</h1>
        <p className="app-hero-subtitle">Manage your account</p>
        <p className="app-hero-body">{user?.email}</p>
      </div>

      <div className="section-title">Account</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="settings-nav-card">
              <span className="settings-nav-icon">{s.icon}</span>
              <div>
                <div className="settings-nav-title">{s.title}</div>
                <div className="settings-nav-desc">{s.desc}</div>
              </div>
              <span className="settings-nav-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
