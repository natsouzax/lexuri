import Link from 'next/link'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <Link href="/" style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.3rem', color: 'var(--ink)', textDecoration: 'none' }}>
          Lexuri
        </Link>
        <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--moss)', textDecoration: 'none' }}>
          Entrar
        </Link>
      </header>
      <main className="mkt-main">{children}</main>
      <footer style={{ padding: '32px 24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)' }}>
        <Link href="/privacy" style={{ color: 'var(--muted)', marginRight: 16 }}>Privacidade</Link>
        <Link href="/terms" style={{ color: 'var(--muted)' }}>Termos</Link>
      </footer>
    </div>
  )
}
