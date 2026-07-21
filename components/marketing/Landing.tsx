'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import { EASE_OUT } from '@/lib/easing'
import HeroLyricsDemo from './HeroLyricsDemo'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE_OUT },
})

// Landing do MVP sobre o design system original do Lexuri (hero escuro,
// paleta paper/moss/sage/clay/butter), com foco em música e tom de
// projeto de pesquisa. Título em uma linha reta e demo interativa.
export default function Landing() {
  const { t } = useLang()

  const steps = [
    { icon: '🎵', bg: 'var(--sage)',           title: t('landing.step1.title'), desc: t('landing.step1.desc') },
    { icon: '👆', bg: 'rgba(200,111,74,0.16)', title: t('landing.step2.title'), desc: t('landing.step2.desc') },
    { icon: '🔁', bg: 'rgba(246,202,95,0.28)', title: t('landing.step3.title'), desc: t('landing.step3.desc') },
  ]

  return (
    <>
      <section className="mkt-section-dark" style={{ padding: '64px 0 80px', overflow: 'hidden' }}>
        <div className="mkt-container mkt-redesign-hero">
          <div>
            <motion.span className="mkt-eyebrow mkt-eyebrow-dark" {...fadeUp(0.08)}>
              {t('landing.badge')}
            </motion.span>

            {/* Título reto/horizontal, escala controlada pra caber em linhas cheias */}
            <motion.h1
              className="mkt-h1"
              style={{ color: 'var(--paper)', fontSize: 'clamp(2.1rem, 4.4vw, 3.4rem)', lineHeight: 1.1, maxWidth: 620 }}
              {...fadeUp(0.18)}
            >
              {t('landing.title')}
            </motion.h1>

            <motion.p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 28, maxWidth: 520 }} {...fadeUp(0.3)}>
              {t('landing.body')}
            </motion.p>

            <motion.div className="mkt-btn-group" {...fadeUp(0.42)}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className="btn-mkt-primary">{t('landing.cta')}</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/login" className="btn-mkt-ghost">{t('landing.login')}</Link>
              </motion.div>
            </motion.div>

            <motion.p style={{ fontSize: '0.8rem', color: 'var(--dark-muted)', marginTop: 14 }} {...fadeUp(0.5)}>
              {t('landing.time')}
            </motion.p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroLyricsDemo />
          </div>
        </div>
      </section>

      <section className="mkt-section-cream mkt-section-sm">
        <div className="mkt-container" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
                whileHover={{ y: -3 }}
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

          <motion.div
            style={{ textAlign: 'center', marginTop: 36 }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <Link href="/register" className="btn-mkt-dark">{t('landing.cta')}</Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
