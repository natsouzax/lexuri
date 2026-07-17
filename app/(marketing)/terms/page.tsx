import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Lexuri — AI-powered English learning platform.',
}

export default function TermsPage() {
  return (
    <div className="mkt-legal">
      <div className="mkt-legal-inner">

        <div className="mkt-legal-header">
          <p className="mkt-legal-eyebrow">Legal</p>
          <h1 className="mkt-legal-title">Terms of Service</h1>
          <p className="mkt-legal-meta">
            Effective date: <strong>June 20, 2026</strong> &nbsp;·&nbsp; Version 1.0
          </p>
        </div>

        <div className="mkt-legal-body">

          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Lexuri
            (&ldquo;Service&rdquo;), operated by Natan Oliveira (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            or &ldquo;our&rdquo;), a sole proprietor based in Brazil. By creating an account or
            using the Service, you agree to be bound by these Terms. If you do not agree, do not
            use the Service.
          </p>

          <h2>1. Description of Service</h2>
          <p>
            Lexuri is an AI-powered English learning platform that allows users to extract
            language chunks from YouTube videos and song lyrics, generate flashcards, and review
            vocabulary using spaced repetition. The Service uses third-party AI APIs (OpenAI)
            to process content submitted by users.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use the Service. If you are under 18, you
            represent that your legal guardian has reviewed and agreed to these Terms on your
            behalf.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account. You agree to provide accurate
            and complete information when creating your account and to update it as necessary.
            We reserve the right to terminate accounts that violate these Terms.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any regulations;</li>
            <li>Submit content that infringes third-party intellectual property rights;</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the Service or its APIs;</li>
            <li>Use automated tools to access the Service without prior written consent;</li>
            <li>Share your account credentials with third parties;</li>
            <li>Circumvent any usage limits or access controls.</li>
          </ul>

          <h2>5. Content and Intellectual Property</h2>
          <p>
            <strong>Your content:</strong> You retain ownership of the content you submit to the
            Service (e.g., YouTube URLs, vocabulary selections). By submitting content, you grant
            us a limited, non-exclusive license to process it solely to provide the Service to you.
          </p>
          <p>
            <strong>Our content:</strong> The Lexuri name, logo, design, software, and all
            AI-generated flashcard content produced by the Service are owned by or licensed to
            us. You may not copy, modify, distribute, or create derivative works without our
            written permission.
          </p>
          <p>
            <strong>Third-party content:</strong> YouTube videos and song lyrics accessed through
            the Service are subject to their respective copyright holders&rsquo; terms. Lexuri does
            not host this content — it is processed in real time and stored only as user-selected
            excerpts in your personal flashcard library.
          </p>

          <h2>6. AI-Generated Content</h2>
          <p>
            The Service uses OpenAI to generate flashcard definitions, translations, and language
            explanations. AI-generated content may occasionally be inaccurate. You are responsible
            for reviewing the accuracy of content before relying on it for language learning.
            We do not guarantee the accuracy, completeness, or appropriateness of AI-generated outputs.
          </p>

          <h2>7. Subscriptions and Payments</h2>
          <p>
            The Service offers a free tier and a paid &ldquo;Pro&rdquo; subscription. Payments are
            processed by Stripe. By subscribing, you agree to Stripe&rsquo;s terms of service.
          </p>
          <p>
            Subscriptions renew automatically at the end of each billing period. You may cancel
            your subscription at any time through your account settings. Cancellation takes effect
            at the end of the current billing period — you will retain access until then. We do
            not provide refunds for partial periods, except where required by applicable law.
          </p>

          <h2>8. Free Tier Limits</h2>
          <p>
            Free-tier accounts are subject to usage limits on AI features (chunk detection and
            flashcard generation). These limits may change at any time. We will notify active
            users of material changes via email.
          </p>

          <h2>9. Service Availability</h2>
          <p>
            We strive to maintain the Service operational 24/7 but do not guarantee uninterrupted
            availability. We may modify, suspend, or discontinue any part of the Service at any
            time. We will provide reasonable notice of material changes where possible.
          </p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
            WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR THAT DEFECTS WILL BE CORRECTED.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
            REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
            OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR ANY CLAIMS UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU
            PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR R$100.00 (ONE HUNDRED BRAZILIAN REAIS),
            WHICHEVER IS GREATER.
          </p>

          <h2>12. Termination</h2>
          <p>
            You may delete your account at any time through Settings → Delete Account. We may
            suspend or terminate your access immediately if you violate these Terms or if we
            discontinue the Service. Upon termination, your data will be deleted within 30 days
            as described in our Privacy Policy.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Brazil, specifically the Consumer Defense Code
            (Lei 8.078/1990), the Brazilian Civil Code, and the Brazilian General Data Protection
            Law (LGPD — Lei 13.709/2018). Any disputes shall be resolved in the courts of Brazil.
          </p>

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes
            by email or by posting a notice in the Service. Your continued use of the Service
            after the effective date of the revised Terms constitutes your acceptance of the changes.
          </p>

          <h2>15. Contact</h2>
          <p>
            Questions about these Terms? Contact us at:{' '}
            <a href="mailto:natanoliveiraad855@gmail.com" className="mkt-legal-link">
              natanoliveiraad855@gmail.com
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}
