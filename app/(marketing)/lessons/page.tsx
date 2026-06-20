import type { Metadata } from 'next'
import { FEED_ITEMS } from '@/lib/feed'
import LessonsContent from '@/components/marketing/LessonsContent'

export const metadata: Metadata = {
  title: 'Featured Lessons — Learn English with Lexuri',
  description: 'Explore our hand-picked English lessons from music and YouTube videos. Each one is packed with phrasal verbs, idioms, and collocations detected by AI.',
}

const FEATURED = FEED_ITEMS.filter((item) => item.featured && !item.maintenance)

export default function LessonsIndexPage() {
  return <LessonsContent items={FEATURED} />
}
