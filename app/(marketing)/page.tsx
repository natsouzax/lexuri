import type { Metadata } from 'next'
import HeroSection from '@/components/marketing/HeroSection'
import StepsSection from '@/components/marketing/StepsSection'
import ComparisonSection from '@/components/marketing/ComparisonSection'
import FeaturesSection from '@/components/marketing/FeaturesSection'
import SocialProofSection from '@/components/marketing/SocialProofSection'
import FAQSection from '@/components/marketing/FAQSection'
import CTASection from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'Lexuri - Turn real content into English fluency',
  description: 'AI-powered English learning. Turn YouTube videos, songs, and transcripts into chunks, flashcards, and smart reviews.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StepsSection />
      <ComparisonSection />
      <FeaturesSection />
      <SocialProofSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
