'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

const FIELDS = [
  { name: 'name',    label: 'Your name',  type: 'text',  placeholder: 'Ada Lovelace' },
  { name: 'email',   label: 'Email',      type: 'email', placeholder: 'you@example.com' },
  { name: 'subject', label: 'Subject',    type: 'text',  placeholder: 'Feature request / Bug / General' },
]

export default function ContactContent() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const formRef = useRef<HTMLDivElement>(null)
  const formInView = useInView(formRef, { once: true, margin: '-60px 0px' })

  return (
    <>
      {/* Hero */}
      <section className="mkt-section-sm mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }} ref={heroRef}>
          <motion.span
            className="mkt-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            Get In Touch
          </motion.span>
          <motion.h1
            className="mkt-h1"
            style={{ color: 'var(--paper)', margin: '0 auto 16px', maxWidth: 560 }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
          >
            We read every message.
          </motion.h1>
          <motion.p
            className="mkt-lead mkt-lead-dark"
            style={{ margin: '0 auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
          >
            Feature requests, bug reports, feedback, or just to say hi — we&apos;re here.
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container" style={{ maxWidth: 640, margin: '0 auto' }} ref={formRef}>
          <form
            action="mailto:natanoliveiraad855@gmail.com"
            method="get"
            encType="text/plain"
          >
            {FIELDS.map(({ name, label, type, placeholder }, i) => (
              <motion.div
                key={name}
                style={{ marginBottom: 8 }}
                initial={{ opacity: 0, y: 16 }}
                animate={formInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
              >
                <label style={{ display: 'block', fontWeight: 900, fontSize: '0.82rem', marginBottom: 6, color: 'var(--ink)' }}>
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  className="contact-field"
                  style={{ display: 'block' }}
                />
              </motion.div>
            ))}

            <motion.div
              style={{ marginBottom: 24 }}
              initial={{ opacity: 0, y: 16 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.28, ease: EASE_OUT }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <button type="submit" className="btn-mkt-dark" style={{ width: '100%', justifyContent: 'center' }}>
                Send message →
              </button>
            </motion.div>
          </form>

          <Reveal delay={0.1} style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              You can also reach us directly at{' '}
              <a href="mailto:natanoliveiraad855@gmail.com" style={{ color: 'var(--moss)', fontWeight: 700 }}>
                natanoliveiraad855@gmail.com
              </a>
              . We typically respond within 24–48 hours.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
