import type { Metadata } from 'next'
import AboutContent from '@/components/marketing/AboutContent'

export const metadata: Metadata = {
  title: 'About',
  description: 'Why Lexuri exists, our learning philosophy, and the science behind chunk-based language acquisition.',
}

export default function AboutPage() {
  return <AboutContent />
}
