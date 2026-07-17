import type { Metadata } from 'next'
import ContactContent from '@/components/marketing/ContactContent'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Lexuri team — feedback, feature requests, or just to say hello.',
}

export default function ContactPage() {
  return <ContactContent />
}
