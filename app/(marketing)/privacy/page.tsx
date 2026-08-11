import type { Metadata } from 'next'
import { DATA_CONTACT_EMAIL, LEGAL_VERSION } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How the Lexuri validation beta collects, uses, and protects personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="mkt-legal">
      <div className="mkt-legal-inner">
        <div className="mkt-legal-header">
          <p className="mkt-legal-eyebrow">Legal</p>
          <h1 className="mkt-legal-title">Privacy Policy</h1>
          <p className="mkt-legal-meta">
            Effective date: <strong>August 11, 2026</strong> &nbsp;·&nbsp; Version {LEGAL_VERSION}
          </p>
        </div>

        <div className="mkt-legal-body">
          <p>
            This policy explains how the Lexuri validation beta (&ldquo;Lexuri&rdquo;), operated by
            Natan Oliveira in Brazil, handles personal data. The beta exists to test whether
            learning English through music improves engagement and retention. It is not currently
            a paid service.
          </p>

          <div className="mkt-legal-note">
            <strong>Data controller and privacy contact:</strong> Natan Oliveira<br />
            <a href={`mailto:${DATA_CONTACT_EMAIL}`} className="mkt-legal-link">{DATA_CONTACT_EMAIL}</a>
          </div>

          <h2>1. Data We Collect</h2>

          <h3>1.1 Account and consent data</h3>
          <ul>
            <li>Name and email address</li>
            <li>Password credential managed by Supabase Auth; Lexuri does not receive the plain-text password</li>
            <li>Acceptance date and version for the Terms and this Privacy Policy</li>
            <li>Optional marketing preference and the date it was last changed</li>
          </ul>

          <h3>1.2 Learning and validation data</h3>
          <ul>
            <li>Selected English level and language preferences</li>
            <li>Saved words, translations, review answers, takeaways, personal examples, and generated verses</li>
            <li>Song and album progress, review dates, scores, streaks, badges, and pronunciation results</li>
            <li>Feedback you choose to submit</li>
          </ul>
          <p>
            Lexuri uses the timestamps and completion records above to calculate learning progress
            and evaluate the beta. It does not use third-party advertising trackers.
          </p>

          <h3>1.3 Text and audio sent to AI</h3>
          <ul>
            <li>Words, expressions, answers, and takeaways sent for translation, feedback, or generation</li>
            <li>Short speaking recordings sent for transcription and clarity feedback</li>
            <li>A final song recording stored privately only after you explicitly choose to save it</li>
          </ul>
          <p>
            Short speaking recordings are processed in memory and are not saved by Lexuri. Final
            recordings are kept in a private Supabase Storage bucket and served through temporary
            signed links.
          </p>

          <h3>1.4 Technical data</h3>
          <ul>
            <li>Authentication cookies required to keep you signed in</li>
            <li>IP address, browser information, request path, and error details that may appear in hosting logs</li>
            <li>Local browser preferences, such as the selected language and collapsed panels</li>
          </ul>

          <h2>2. Why We Process the Data</h2>
          <table className="mkt-legal-table">
            <thead><tr><th>Purpose</th><th>LGPD basis</th></tr></thead>
            <tbody>
              <tr><td>Create the account and deliver the requested learning experience</td><td>Contract execution (Art. 7, V)</td></tr>
              <tr><td>Process optional microphone recordings</td><td>Consent (Art. 7, I)</td></tr>
              <tr><td>Send optional product tips</td><td>Consent (Art. 7, I)</td></tr>
              <tr><td>Protect the beta from abuse and understand aggregate completion/retention</td><td>Legitimate interest (Art. 7, IX), balanced against user rights</td></tr>
              <tr><td>Comply with legal requests and protect rights</td><td>Legal obligation or regular exercise of rights (Art. 7, II and VI)</td></tr>
            </tbody>
          </table>

          <h2>3. Service Providers</h2>
          <table className="mkt-legal-table">
            <thead><tr><th>Provider</th><th>Purpose</th><th>Data involved</th></tr></thead>
            <tbody>
              <tr>
                <td><a href="https://supabase.com/privacy" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">Supabase</a></td>
                <td>Authentication, database, and private recording storage</td>
                <td>Account and learning data; saved final recordings</td>
              </tr>
              <tr>
                <td><a href="https://openai.com/policies/privacy-policy" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">OpenAI</a></td>
                <td>Translation, language generation, answer assessment, and audio transcription</td>
                <td>Only the text or audio needed for the requested feature</td>
              </tr>
              <tr>
                <td><a href="https://vercel.com/legal/privacy-policy" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">Vercel</a></td>
                <td>Application hosting and request delivery</td>
                <td>IP address and technical request logs</td>
              </tr>
              <tr>
                <td><a href="https://policies.google.com/privacy" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">YouTube / Google</a></td>
                <td>Embedded music video playback</td>
                <td>Playback and technical data subject to YouTube&apos;s own controls</td>
              </tr>
            </tbody>
          </table>
          <p>
            These providers may process data outside Brazil under their own contractual and
            security safeguards. OpenAI states that API data is not used for model training unless
            the customer opts in. Its current data-control documentation lists no abuse-monitoring
            or application-state retention for audio transcription, while text requests may be
            retained in abuse-monitoring logs for up to 30 days. See the{' '}
            <a href="https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">
              OpenAI API data controls
            </a>.
          </p>

          <h2>4. Retention and Account Deletion</h2>
          <ul>
            <li>Account and learning data remain while the account is active.</li>
            <li>Saved final recordings remain until you replace them or delete the account.</li>
            <li>Feedback is retained while useful for the beta or until a valid deletion request.</li>
            <li>Hosting and provider logs follow each provider&apos;s documented retention cycle.</li>
          </ul>
          <p>
            Deleting the account in Settings removes the Supabase Auth user, associated application
            rows, linked feedback and analytics records, and saved recordings. Limited copies may
            remain temporarily in provider backups or security logs according to provider policy or
            legal requirements.
          </p>

          <h2>5. Cookies and Local Storage</h2>
          <p>
            Lexuri uses essential authentication cookies and local browser storage for app
            preferences. It does not use advertising cookies or third-party ad trackers.
          </p>

          <h2>6. Your LGPD Rights</h2>
          <ul>
            <li><strong>Access and information:</strong> request confirmation and a copy of your data.</li>
            <li><strong>Correction:</strong> update your name in Settings.</li>
            <li><strong>Deletion:</strong> permanently delete the account and associated application data in Settings.</li>
            <li><strong>Portability:</strong> request a structured export by email.</li>
            <li><strong>Consent:</strong> change the optional marketing preference in Settings and decline microphone use without losing non-audio features.</li>
            <li><strong>Opposition or complaint:</strong> contact us or the Brazilian data protection authority.</li>
          </ul>
          <p>
            Send requests to <a href={`mailto:${DATA_CONTACT_EMAIL}`} className="mkt-legal-link">{DATA_CONTACT_EMAIL}</a>.
            You may also contact the <a href="https://www.gov.br/anpd" className="mkt-legal-link" target="_blank" rel="noopener noreferrer">ANPD</a>.
          </p>

          <h2>7. Security</h2>
          <ul>
            <li>TLS/HTTPS in transit</li>
            <li>Row-Level Security for user-owned database records</li>
            <li>Private storage and short-lived signed URLs for saved recordings</li>
            <li>Server-only API and service-role keys</li>
            <li>Per-user daily quotas for paid AI operations</li>
          </ul>
          <p>No internet service can guarantee absolute security.</p>

          <h2>8. Students Under 18</h2>
          <p>
            Lexuri is not available to children under 13. Users aged 13–17 may participate only
            with authorization from a legal guardian and, for a school-organized test, under the
            arrangements communicated by the teacher or school. The best interests of the student
            must prevail.
          </p>
          <div className="mkt-legal-note">
            <strong>Resumo para estudantes e responsáveis:</strong> menores de 13 anos não podem
            usar o beta. Entre 13 e 17 anos, participe somente com autorização do responsável.
            O aluno pode recusar o microfone e pode excluir a conta e os dados em Settings.
          </div>

          <h2>9. Changes and Contact</h2>
          <p>
            Material changes will receive a new document version and, when necessary, renewed
            acceptance. Questions or complaints can be sent to{' '}
            <a href={`mailto:${DATA_CONTACT_EMAIL}`} className="mkt-legal-link">{DATA_CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
