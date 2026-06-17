import type { Metadata } from 'next'
import RoadmapContent from '@/components/marketing/RoadmapContent'

export const metadata: Metadata = {
  title: 'Roadmap',
  description: "What's live, what's next, and what's planned for Lexuri — mobile app, browser extension, Netflix mode, AI tutor, and more.",
}

export default function RoadmapPage() {
  return <RoadmapContent />
}
