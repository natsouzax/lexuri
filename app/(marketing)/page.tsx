import type { Metadata } from 'next'
import Landing from '@/components/marketing/Landing'

export const metadata: Metadata = {
  title: 'Lexuri — Learn English with the songs you love',
  description:
    'Research project: learn English by listening to music with synced lyrics, tap-to-translate and short 3-day reviews.',
}

export default function HomePage() {
  return <Landing />
}
