import type { Metadata } from 'next'
import Link from 'next/link'
import SupportTierList from './SupportTierList'

export const metadata: Metadata = {
  title: 'Support Lexuri',
  description: 'Lexuri is free, indie, and built by one person. If it helped you learn, consider supporting its development.',
}

const WHAT_IT_FUNDS = [
  {
    icon: '⚡',
    label: 'AI processing',
    body: 'Every transcript, chunk detection, and flashcard generation costs real money in API calls. Donations keep the free tier alive.',
  },
  {
    icon: '🖥️',
    label: 'Server & infrastructure',
    body: "Hosting, databases, and CDN bandwidth aren't free. Your support keeps the app fast and reliable.",
  },
  {
    icon: '🛠️',
    label: 'New features',
    body: 'More donation support = more time to build. Podcast support, reading mode, and mobile apps are all on the roadmap.',
  },
  {
    icon: '🔓',
    label: 'Free access for everyone',
    body: "The goal is to keep the core experience free for learners who can't afford a subscription. Every donation helps subsidise that.",
  },
]

const SUPPORTERS = [
  { amount: 5,  label: 'Buy me a coffee', desc: 'One-time. Covers a few AI API calls.' },
  { amount: 15, label: 'Monthly supporter', desc: 'Keeps the lights on and helps plan ahead.' },
  { amount: 50, label: 'Patron', desc: 'Serious backing. Your name in the credits + early access to everything.' },
]

export default function DonatePage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Support Lexuri</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 680 }}>
            Lexuri is free. Keep it that way.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 36px' }}>
            No VC funding. No growth-hacking. Just one person building a tool for serious learners.
            If it helped you, consider helping back.
          </p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="#support" className="btn-mkt-primary">
              Support now →
            </Link>
            <Link href="/youtube" className="btn-mkt-ghost">
              Try the app first
            </Link>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <span className="mkt-eyebrow">Why it matters</span>
          <h2 className="mkt-h2">Built in the open, not by a corporation.</h2>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
            Lexuri was built because existing language apps felt wrong — isolated vocabulary, gamified streaks, no connection to real speech. So I built something different: chunk-based learning from videos and music you actually enjoy.
          </p>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
            The app is free because language learning should be accessible. But free doesn&apos;t mean costless. AI inference, servers, and storage all have real costs — and right now, I cover them out of pocket.
          </p>
          <p style={{ fontSize: '0.97rem', color: 'var(--muted)', lineHeight: 1.85 }}>
            Every donation, however small, directly extends how long Lexuri stays free and how fast it improves.
          </p>
        </div>
      </section>

      {/* What it funds */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">Where your money goes</span>
            <h2 className="mkt-h2">100% goes into the product.</h2>
          </div>
          <div className="mkt-grid-2col" style={{ gap: 20 }}>
            {WHAT_IT_FUNDS.map(({ icon, label, body }) => (
              <div
                key={label}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 20,
                  padding: '24px 28px',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>{icon}</div>
                <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1rem' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section id="support" className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">How to support</span>
            <h2 className="mkt-h2">Every bit helps.</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 8 }}>
              Secure one-time payment via Stripe. No account required.
            </p>
          </div>
          <SupportTierList supporters={SUPPORTERS} />
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-section-dark" style={{ textAlign: 'center' }}>
        <div className="mkt-container">
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
            Thank you for being here.
          </h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 32px' }}>
            Whether you donate or not, the app is yours. Go learn something real.
          </p>
          <div className="mkt-btn-group" style={{ justifyContent: 'center' }}>
            <Link href="#support" className="btn-mkt-primary">
              Support Lexuri →
            </Link>
            <Link href="/youtube" className="btn-mkt-ghost">Open the app</Link>
          </div>
        </div>
      </section>
    </>
  )
}
