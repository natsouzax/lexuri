import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Verbly team — feedback, feature requests, or just to say hello.',
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Get In Touch</span>
          <h1 className="mkt-h1" style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 560 }}>
            We read every message.
          </h1>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto' }}>
            Feature requests, bug reports, feedback, or just to say hi — we&apos;re here.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 640, margin: '0 auto' }}>
          <form
            action={`mailto:natanoliveiraad855@gmail.com`}
            method="get"
            encType="text/plain"
          >
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.82rem', marginBottom: 6, color: 'var(--ink)' }}>
                Your name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Ada Lovelace"
                className="contact-field"
                style={{ display: 'block' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.82rem', marginBottom: 6, color: 'var(--ink)' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="contact-field"
                style={{ display: 'block' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.82rem', marginBottom: 6, color: 'var(--ink)' }}>
                Subject
              </label>
              <input
                type="text"
                name="subject"
                placeholder="Feature request / Bug / General"
                className="contact-field"
                style={{ display: 'block' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 900, fontSize: '0.82rem', marginBottom: 6, color: 'var(--ink)' }}>
                Message
              </label>
              <textarea
                name="body"
                rows={6}
                placeholder="Tell us what's on your mind..."
                className="contact-field"
                style={{ display: 'block' }}
              />
            </div>
            <button type="submit" className="btn-mkt-dark" style={{ width: '100%', justifyContent: 'center' }}>
              Send message →
            </button>
          </form>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              You can also reach us directly at{' '}
              <a href="mailto:natanoliveiraad855@gmail.com" style={{ color: 'var(--moss)', fontWeight: 700 }}>
                natanoliveiraad855@gmail.com
              </a>
              . We typically respond within 24–48 hours.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
