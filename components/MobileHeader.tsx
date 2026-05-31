import Link from 'next/link'

export default function MobileHeader() {
  return (
    <header className="mobile-app-header">
      <Link href="/" className="mobile-app-logo">Verbly</Link>
    </header>
  )
}
