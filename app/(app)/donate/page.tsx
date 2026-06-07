export const metadata = {
  title: 'Support Verbly',
  description: 'Help us keep Verbly free and build the mobile app.',
}

export default function DonatePage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.2rem', marginBottom: 8 }}>
        Support Verbly ♥
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 36 }}>
        100% free · no paywalls · no ads
      </p>

      <div
        style={{
          background: 'var(--sage)',
          borderRadius: 16,
          padding: '28px 28px',
          marginBottom: 32,
        }}
      >
        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, margin: 0 }}>
          Verbly is built and maintained by a small team that genuinely cares about helping you
          reach fluency. Every feature — the YouTube studio, spaced repetition, AI flashcards,
          music lyrics — is free, with no premium tier hiding the good stuff.
        </p>
      </div>

      <p style={{ lineHeight: 1.8, marginBottom: 24 }}>
        If Verbly has helped you understand a song, nail a tricky phrase, or just enjoy learning a
        language more, consider buying us a coffee. Your support keeps the servers running and,
        more excitingly, funds the mobile app we&apos;re building so you can study anywhere.
      </p>

      <p style={{ lineHeight: 1.8, marginBottom: 36, color: 'var(--muted)' }}>
        There&apos;s no subscription, no badge, no pressure. A one-time donation of any amount makes
        a real difference and means the world to us.
      </p>

      <a
        href="https://donate.stripe.com/placeholder"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
        style={{
          display: 'inline-block',
          background: 'var(--clay)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '14px 32px',
          borderRadius: 12,
          textDecoration: 'none',
          transition: 'opacity 150ms ease',
        }}
      >
        Donate · Support our work ♥
      </a>

      <p style={{ marginTop: 20, fontSize: '0.82rem', color: 'var(--muted)' }}>
        Secure payment via Stripe. No account required.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '40px 0' }} />

      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>What your support funds</h2>
      <ul style={{ lineHeight: 2, paddingLeft: 20, color: 'var(--muted)' }}>
        <li>Server & infrastructure costs</li>
        <li>AI API usage (OpenAI, transcription, etc.)</li>
        <li>Mobile app development (iOS & Android)</li>
        <li>New features and language support</li>
      </ul>

      <p style={{ marginTop: 32, fontSize: '0.9rem', color: 'var(--muted)' }}>
        Thank you — seriously. Every contribution, big or small, keeps this project alive. 🌱
      </p>
    </div>
  )
}
