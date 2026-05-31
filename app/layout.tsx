import type { Metadata } from 'next'
import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'Verbly',
    template: '%s | Verbly',
  },
  description: 'Learn English from the videos and music you already love. AI-powered chunk detection, flashcards, and spaced repetition.',
  openGraph: {
    title: 'Verbly',
    description: 'Learn English from the videos and music you already love.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verbly',
    description: 'Learn English from the videos and music you already love.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
