import type { Metadata } from 'next'
import FeaturesContent from '@/components/marketing/FeaturesContent'

export const metadata: Metadata = {
  title: 'Features — Lexuri',
  description: 'Everything Lexuri can do — AI chunk detection, native-language translations, YouTube & music learning, flashcards, spaced repetition, gamification, and more.',
}

export default function FeaturesPage() {
  return <FeaturesContent />
}
