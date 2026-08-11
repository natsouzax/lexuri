import type { Metadata } from 'next'
import { DATA_CONTACT_EMAIL, LEGAL_VERSION } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for participating in the Lexuri validation beta.',
}

export default function TermsPage() {
  return (
    <div className="mkt-legal">
      <div className="mkt-legal-inner">
        <div className="mkt-legal-header">
          <p className="mkt-legal-eyebrow">Legal</p>
          <h1 className="mkt-legal-title">Terms of Service</h1>
          <p className="mkt-legal-meta">
            Effective date: <strong>August 11, 2026</strong> &nbsp;·&nbsp; Version {LEGAL_VERSION}
          </p>
        </div>

        <div className="mkt-legal-body">
          <p>
            These Terms govern participation in the Lexuri validation beta, operated by Natan
            Oliveira in Brazil. Creating an account means you agree to these Terms and the Privacy
            Policy for the document version shown at registration.
          </p>

          <h2>1. Beta Purpose and Scope</h2>
          <p>
            Lexuri is a research prototype for learning English through music. It provides curated
            song lessons, saved vocabulary, spaced review, glossary practice, gamification, and
            optional speaking exercises. The current beta is free and does not offer a paid plan.
          </p>
          <p>
            Features may change, contain errors, or be temporarily unavailable during the test.
            Feedback is welcome but participation does not create an employment, school-grade, or
            paid-service relationship.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 13 years old. If you are 13–17, a legal guardian must authorize
            your participation and review these Terms and the Privacy Policy. Users under 13 may
            not create an account. A teacher&apos;s invitation does not replace guardian authorization
            when it is required.
          </p>

          <h2>3. Account Responsibilities</h2>
          <ul>
            <li>Provide accurate registration information and use only your own account.</li>
            <li>Keep the password confidential and report suspected unauthorized access.</li>
            <li>Do not share private information about another person in answers or feedback.</li>
            <li>Use the microphone only when you are comfortable doing so; audio exercises are optional.</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You must not:</p>
          <ul>
            <li>Use Lexuri unlawfully or to harm, harass, or impersonate another person.</li>
            <li>Submit content that violates privacy, copyright, or other third-party rights.</li>
            <li>Probe, automate, scrape, overload, reverse-engineer, or bypass access and usage controls.</li>
            <li>Use AI output as professional legal, medical, financial, or safety advice.</li>
          </ul>

          <h2>5. Content and Music</h2>
          <p>
            You retain rights in original text and recordings you submit. You authorize Lexuri and
            its documented service providers to process that content only to provide, protect, and
            evaluate the beta as described in the Privacy Policy.
          </p>
          <p>
            Music videos, lyrics, artist names, and related material belong to their respective
            rights holders. Lexuri uses embedded playback and curated educational excerpts; it does
            not grant permission to redistribute third-party content.
          </p>

          <h2>6. AI-Generated Feedback</h2>
          <p>
            Translations, definitions, questions, verses, transcriptions, and pronunciation feedback
            may be inaccurate or incomplete. Treat them as learning aids, verify important details,
            and report harmful or clearly incorrect output.
          </p>

          <h2>7. Usage Limits and Availability</h2>
          <p>
            Per-user limits may temporarily stop paid AI features to control abuse and test costs.
            Lexuri may change, pause, or end the beta and will provide reasonable notice when
            practical. No uninterrupted uptime is guaranteed.
          </p>

          <h2>8. Privacy and Account Deletion</h2>
          <p>
            The Privacy Policy explains data handling and user rights. You may update your profile,
            withdraw optional marketing consent, or permanently delete the account in Settings.
            Account deletion also removes saved final recordings and cannot be undone.
          </p>

          <h2>9. Disclaimer and Liability</h2>
          <p>
            The beta is provided &ldquo;as is&rdquo; for evaluation. To the extent permitted by Brazilian
            law, Lexuri does not guarantee that the service or AI output will be error-free, suitable
            for a particular learning result, or continuously available. Nothing in these Terms
            excludes rights that cannot legally be waived, including applicable consumer and data
            protection rights.
          </p>

          <h2>10. Suspension and Termination</h2>
          <p>
            Access may be suspended for abuse, security risk, or violation of these Terms. You may
            end participation at any time by deleting the account. The beta may also be discontinued
            after reasonable notice when practical.
          </p>

          <h2>11. Governing Law and Changes</h2>
          <p>
            Brazilian law applies, including the Civil Code, Consumer Defense Code where applicable,
            and LGPD. Material changes receive a new version and may require renewed acceptance.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions can be sent to{' '}
            <a href={`mailto:${DATA_CONTACT_EMAIL}`} className="mkt-legal-link">{DATA_CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
