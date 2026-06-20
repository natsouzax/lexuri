import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Lexuri — how we collect, use, and protect your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="mkt-legal">
      <div className="mkt-legal-inner">

        <div className="mkt-legal-header">
          <p className="mkt-legal-eyebrow">Legal</p>
          <h1 className="mkt-legal-title">Privacy Policy</h1>
          <p className="mkt-legal-meta">
            Effective date: <strong>June 20, 2026</strong> &nbsp;·&nbsp; Version 1.0
          </p>
        </div>

        <div className="mkt-legal-body">

          <p>
            This Privacy Policy describes how Lexuri (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
            or &ldquo;our&rdquo;), operated by Natan Oliveira, collects,
            uses, shares, and protects your personal data when you use the Lexuri platform
            (&ldquo;Service&rdquo;). This policy is written in compliance with the Brazilian
            General Data Protection Law (LGPD — Lei 13.709/2018).
          </p>

          <div className="mkt-legal-note">
            <strong>Data Controller:</strong> Natan Oliveira<br />
            <strong>Contact / DPO:</strong>{' '}
            <a href="mailto:natanoliveiraad855@gmail.com" className="mkt-legal-link">
              natanoliveiraad855@gmail.com
            </a>
          </div>

          <h2>1. What Data We Collect</h2>

          <h3>1.1 Account Data</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (stored as a bcrypt hash — we never see your plain-text password)</li>
            <li>OAuth provider ID (if you sign up via Google or GitHub)</li>
          </ul>

          <h3>1.2 Profile and Learning Data</h3>
          <ul>
            <li>Native language and English proficiency level (CEFR)</li>
            <li>Learning objectives you set during onboarding</li>
            <li>Flashcards you create (word, definition, source URL)</li>
            <li>Review history and SM-2 algorithm parameters</li>
            <li>Points, streak, and badge history</li>
          </ul>

          <h3>1.3 Content You Submit</h3>
          <ul>
            <li>YouTube URLs you paste into the Service</li>
            <li>Song titles you search via the Music Lab</li>
            <li>Text excerpts (chunks) you select from transcripts or lyrics</li>
          </ul>
          <p>
            This content is sent to our AI provider (OpenAI) to generate flashcard definitions
            and language explanations. See Section 4 for details.
          </p>

          <h3>1.4 Usage and Technical Data</h3>
          <ul>
            <li>Pages visited and features used (analytics events)</li>
            <li>Device type, browser, and operating system</li>
            <li>IP address (retained in server logs for up to 30 days)</li>
            <li>Session tokens (stored in secure HTTP-only cookies)</li>
          </ul>

          <h3>1.5 Payment Data</h3>
          <p>
            If you subscribe to Lexuri Pro, your payment details (card number, billing address)
            are collected and stored directly by <strong>Stripe</strong>. We only receive a
            subscription status and a customer ID — we never see or store your full card number.
          </p>

          <h2>2. Legal Basis for Processing (LGPD Art. 7)</h2>

          <table className="mkt-legal-table">
            <thead>
              <tr>
                <th>Processing Activity</th>
                <th>Legal Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account creation and authentication</td>
                <td>Contract execution (Art. 7, V)</td>
              </tr>
              <tr>
                <td>AI-generated flashcards and chunk analysis</td>
                <td>Contract execution (Art. 7, V)</td>
              </tr>
              <tr>
                <td>Payment processing</td>
                <td>Contract execution (Art. 7, V)</td>
              </tr>
              <tr>
                <td>Transactional emails (verification, password reset)</td>
                <td>Contract execution (Art. 7, V)</td>
              </tr>
              <tr>
                <td>Marketing emails (product updates, tips)</td>
                <td>Consent (Art. 7, I) — opt-in at registration</td>
              </tr>
              <tr>
                <td>Analytics and product improvement</td>
                <td>Legitimate interest (Art. 7, IX)</td>
              </tr>
            </tbody>
          </table>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>Provide, operate, and improve the Service</li>
            <li>Generate AI-powered flashcards and language explanations</li>
            <li>Calculate spaced repetition schedules and gamification scores</li>
            <li>Send transactional emails (account verification, password reset, daily reminders)</li>
            <li>Send product updates and tips (only if you opted in)</li>
            <li>Analyze usage patterns to improve the Service</li>
            <li>Prevent fraud and abuse</li>
          </ul>

          <h2>4. Third-Party Services That Receive Your Data</h2>
          <p>
            We use the following third-party services. Each is bound by a Data Processing
            Agreement (DPA) with us and by its own privacy policy.
          </p>

          <table className="mkt-legal-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Country</th>
                <th>Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><a href="https://supabase.com/privacy" className="mkt-legal-link" target="_blank" rel="noopener">Supabase</a></td>
                <td>Database, authentication, real-time</td>
                <td>USA</td>
                <td>All account and learning data</td>
              </tr>
              <tr>
                <td><a href="https://openai.com/policies/privacy-policy" className="mkt-legal-link" target="_blank" rel="noopener">OpenAI</a></td>
                <td>AI flashcard generation, chunk analysis</td>
                <td>USA</td>
                <td>Text/audio you submit for processing</td>
              </tr>
              <tr>
                <td><a href="https://stripe.com/privacy" className="mkt-legal-link" target="_blank" rel="noopener">Stripe</a></td>
                <td>Payment processing</td>
                <td>USA</td>
                <td>Email, payment data (managed by Stripe)</td>
              </tr>
              <tr>
                <td><a href="https://resend.com/privacy" className="mkt-legal-link" target="_blank" rel="noopener">Resend</a></td>
                <td>Transactional email delivery</td>
                <td>USA</td>
                <td>Email address, email content</td>
              </tr>
              <tr>
                <td><a href="https://vercel.com/legal/privacy-policy" className="mkt-legal-link" target="_blank" rel="noopener">Vercel</a></td>
                <td>Hosting and content delivery</td>
                <td>USA</td>
                <td>IP address, request logs</td>
              </tr>
              <tr>
                <td>Genius API</td>
                <td>Song lyrics search</td>
                <td>USA</td>
                <td>Search queries only (no account data)</td>
              </tr>
            </tbody>
          </table>

          <p>
            International data transfers to the USA are made under Standard Contractual Clauses
            (SCCs) as adopted by the European Commission and recognized under Brazilian LGPD
            international transfer provisions.
          </p>

          <h2>5. Data Retention</h2>
          <ul>
            <li><strong>Active accounts:</strong> Data is retained for the lifetime of your account.</li>
            <li><strong>Deleted accounts:</strong> All personal data is deleted within 30 days of account deletion, except where we are required to retain it by law (e.g., payment records for tax purposes — retained for 5 years).</li>
            <li><strong>Server logs (IP):</strong> Retained for 30 days.</li>
            <li><strong>Analytics events:</strong> Retained in anonymized form after 12 months.</li>
          </ul>

          <h2>6. Cookies and Local Storage</h2>
          <p>We use the following storage mechanisms:</p>
          <ul>
            <li><strong>Session cookies:</strong> Secure, HTTP-only cookies set by Supabase Auth to maintain your login session. Required for the Service to function.</li>
            <li><strong>Local Storage / IndexedDB:</strong> Used for offline flashcard queue and app preferences. Stored only on your device.</li>
          </ul>
          <p>We do not use advertising or tracking cookies from third-party ad networks.</p>

          <h2>7. Your Rights Under LGPD (Art. 18)</h2>
          <p>
            As a data subject under Brazilian law, you have the following rights regarding your
            personal data:
          </p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Update incorrect or incomplete data via Settings → Profile.</li>
            <li><strong>Deletion:</strong> Delete your account and all associated data via Settings → Delete Account.</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format (email us).</li>
            <li><strong>Revocation of consent:</strong> Withdraw marketing consent at any time in Settings → Profile.</li>
            <li><strong>Information:</strong> Request information about which third parties we share your data with (this policy provides that information).</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:natanoliveiraad855@gmail.com" className="mkt-legal-link">
              natanoliveiraad855@gmail.com
            </a>. We will respond within 15 business days.
          </p>
          <p>
            You also have the right to lodge a complaint with the Brazilian National Data Protection
            Authority (ANPD) at{' '}
            <a href="https://www.gov.br/anpd" className="mkt-legal-link" target="_blank" rel="noopener">
              gov.br/anpd
            </a>.
          </p>

          <h2>8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            data, including:
          </p>
          <ul>
            <li>All data in transit is encrypted via TLS/HTTPS</li>
            <li>Database access is restricted by Row-Level Security (RLS) policies</li>
            <li>Passwords are stored as bcrypt hashes</li>
            <li>API keys and secrets are never exposed client-side</li>
            <li>Supabase service role key is used only server-side for administrative operations</li>
          </ul>
          <p>
            No system is perfectly secure. In the event of a data breach that poses a risk to
            your rights and freedoms, we will notify you and the ANPD within the timeframes
            required by LGPD.
          </p>

          <h2>9. Children&rsquo;s Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect
            personal data from children under 13. If you believe a child has provided us with
            personal data without parental consent, contact us and we will delete it promptly.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by email or by displaying a prominent notice in the Service at least 15 days
            before the changes take effect. Your continued use of the Service after the effective
            date constitutes acceptance of the updated policy.
          </p>

          <h2>11. Contact and DPO</h2>
          <p>
            For any questions, data requests, or complaints regarding this Privacy Policy or our
            data practices, contact the Data Protection Officer (Encarregado de Dados):
          </p>
          <div className="mkt-legal-note">
            <strong>Natan Oliveira</strong> — Data Controller &amp; DPO<br />
            <a href="mailto:natanoliveiraad855@gmail.com" className="mkt-legal-link">
              natanoliveiraad855@gmail.com
            </a><br />
            Brazil
          </div>

        </div>
      </div>
    </div>
  )
}
