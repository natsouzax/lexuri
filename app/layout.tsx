import type { Metadata } from 'next'
import './globals.css'
import RotateHint from '@/components/RotateHint'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'Lexuri',
    template: '%s | Lexuri',
  },
  description: 'Learn English from the videos and music you already love. AI-powered chunk detection, flashcards, and spaced repetition.',
  openGraph: {
    title: 'Lexuri',
    description: 'Learn English from the videos and music you already love.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lexuri',
    description: 'Learn English from the videos and music you already love.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RotateHint />
        {children}
      </body>
    </html>
  )
}
