import type { Metadata } from 'next'
import HeroSection from '@/components/marketing/HeroSection'
import StepsSection from '@/components/marketing/StepsSection'
import FeaturesSection from '@/components/marketing/FeaturesSection'

export const metadata: Metadata = {
  title: 'Lexuri - Turn real content into English fluency',
  description: 'AI-powered English learning. Turn YouTube videos and songs into chunks, flashcards, and smart reviews.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StepsSection />
      <FeaturesSection />
    </>
  )
}
