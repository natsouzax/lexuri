import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Verbly',
    template: '%s | Verbly',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      {children}
    </div>
  )
}
