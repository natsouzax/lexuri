'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import { EASE_OUT } from '@/lib/easing'
import HeroLyricsDemo from './HeroLyricsDemo'
import { MusicNoteIcon, TapIcon, RepeatIcon } from '@/components/ui/Icons'

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
    { Icon: MusicNoteIcon, color: 'var(--moss)',  bg: 'var(--sage)',           title: t('landing.step1.title'), desc: t('landing.step1.desc') },
    { Icon: TapIcon,       color: 'var(--clay)',  bg: 'rgba(200,111,74,0.16)', title: t('landing.step2.title'), desc: t('landing.step2.desc') },
    { Icon: RepeatIcon,    color: '#8a6510',      bg: 'rgba(246,202,95,0.28)', title: t('landing.step3.title'), desc: t('landing.step3.desc') },
  ]

  return (
    <>
      {/* Extra top padding clears the fixed floating nav (its background
          still bleeds to the very top, behind/around the nav pill). */}
      <section className="mkt-section-dark mkt-hero-flip mkt-fade-to-cream" style={{ padding: '112px 0 80px' }}>
        <span className="promo-sparkle promo-sparkle-1">✦</span>
        <span className="promo-sparkle promo-sparkle-2">✦</span>
        <span className="promo-sparkle promo-sparkle-3">✦</span>
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

            <motion.p style={{ fontSize: '0.8rem', color: 'rgba(255,250,240,0.8)', marginTop: 14 }} {...fadeUp(0.5)}>
              {t('landing.time')}
            </motion.p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <HeroLyricsDemo />
          </div>
        </div>
      </section>

      <section className="mkt-section-cream mkt-section-sm mkt-fade-to-dark">
        <div className="mkt-container">
          <motion.div
            className="mkt-steps-head"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <span className="mkt-eyebrow">How it works</span>
            <h2 className="mkt-h2">Three steps. Zero pressure.</h2>
          </motion.div>

          <div className="mkt-steps-grid">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                className="mkt-step-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
              >
                <span className="mkt-step-num">{i + 1}</span>
                <span className="mkt-step-icon" style={{ background: s.bg, color: s.color }}><s.Icon size={20} /></span>
                <div className="mkt-step-title">{s.title}</div>
                <div className="mkt-step-desc">{s.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mkt-cta-band"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <span className="promo-sparkle promo-sparkle-1">✦</span>
            <span className="promo-sparkle promo-sparkle-2">✦</span>
            <span className="promo-sparkle promo-sparkle-3">✦</span>
            <h3>Ready to learn from real English?</h3>
            <p>{t('landing.time')}</p>
            <motion.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="btn-mkt-primary">{t('landing.cta')}</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
