'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import { EASE_OUT } from '@/lib/easing'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE_OUT },
})

// Landing do MVP construída sobre o design system original do Lexuri
// (hero escuro mkt-section-dark + paleta paper/moss/sage/clay/butter),
// adaptada ao foco em música e ao tom de projeto de pesquisa.
export default function Landing() {
  const { t } = useLang()

  const steps = [
    { icon: '🎵', bg: 'var(--sage)',           title: t('landing.step1.title'), desc: t('landing.step1.desc') },
    { icon: '👆', bg: 'rgba(200,111,74,0.16)', title: t('landing.step2.title'), desc: t('landing.step2.desc') },
    { icon: '🔁', bg: 'rgba(246,202,95,0.28)', title: t('landing.step3.title'), desc: t('landing.step3.desc') },
  ]

  return (
    <>
      {/* ── Hero escuro, como o original ─────────────────────────────── */}
      <section className="mkt-section-dark" style={{ padding: '72px 0 84px' }}>
        <div className="mkt-container mkt-redesign-hero">
          <div>
            <motion.span className="mkt-eyebrow mkt-eyebrow-dark" {...fadeUp(0.1)}>
              {t('landing.badge')}
            </motion.span>

            <motion.h1 className="mkt-h1" style={{ color: 'var(--paper)' }} {...fadeUp(0.22)}>
              {t('landing.title')}
            </motion.h1>

            <motion.p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 30 }} {...fadeUp(0.34)}>
              {t('landing.body')}
            </motion.p>

            <motion.div className="mkt-btn-group" {...fadeUp(0.46)}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className="btn-mkt-primary">
                  {t('landing.cta')}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/login" className="btn-mkt-ghost">
                  {t('landing.login')}
                </Link>
              </motion.div>
            </motion.div>

            <motion.p style={{ fontSize: '0.8rem', color: 'var(--dark-muted)', marginTop: 14 }} {...fadeUp(0.54)}>
              {t('landing.time')}
            </motion.p>
          </div>

          {/* Preview de letra sincronizada — o produto em miniatura */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT }}
            style={{
              background: 'var(--dark-surface)',
              border: '1px solid var(--dark-border)',
              borderRadius: 20,
              padding: '22px 26px',
              boxShadow: 'var(--shadow-lg)',
              alignSelf: 'center',
              width: '100%',
              maxWidth: 460,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clay-bright)' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--butter)' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: 'var(--dark-muted)' }}>
                ♪ Happy — Pharrell Williams
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: 2.1, color: 'rgba(255,250,240,0.4)' }}>
              It might seem crazy what I&apos;m{' '}
              <span style={{ background: 'rgba(190,220,235,0.16)', color: 'var(--sky)', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
                &apos;bout to say
              </span>
              <br />
              <span style={{ color: 'var(--paper)', fontWeight: 600 }}>
                Clap along if you feel like a{' '}
                <span style={{ background: 'rgba(246,202,95,0.22)', color: 'var(--butter)', borderRadius: 6, padding: '1px 6px', fontWeight: 800 }}>
                  room without a roof
                </span>
              </span>
              <br />
              Because I&apos;m{' '}
              <span style={{ background: 'rgba(217,123,84,0.25)', color: 'var(--clay-bright)', borderRadius: 6, padding: '1px 6px', fontWeight: 800 }}>
                happy
              </span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--clay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>▶</span>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,250,240,0.12)', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--clay), var(--butter))' }} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--dark-muted)' }}>1:29</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Passos, em fundo claro ───────────────────────────────────── */}
      <section className="mkt-section-cream mkt-section-sm">
        <div className="mkt-container" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 18,
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                  {s.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--ink)', marginBottom: 2 }}>
                    <span style={{ color: 'var(--clay)', fontWeight: 900, marginRight: 6 }}>{i + 1}.</span>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link href="/register" className="btn-mkt-dark">
              {t('landing.cta')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
