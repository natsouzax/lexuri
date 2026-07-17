'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { EASE_OUT } from '@/lib/easing'

const STATS = [
  { value: 200,  suffix: '+',  label: 'Early learners',       sub: 'and growing' },
  { value: 15,   suffix: 'k+', label: 'Chunks saved',         sub: 'across all users' },
  { value: 12,   suffix: '',   label: 'Native languages',      sub: 'supported' },
  { value: 4.9,  suffix: '★',  label: 'Avg. satisfaction',    sub: 'from beta users' },
]

function AnimatedNumber({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [display, setDisplay] = useState(0)
  const isDecimal = !Number.isInteger(target)

  useEffect(() => {
    if (!active) return
    const duration = 1200
    const start = performance.now()
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(eased * target)
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [active, target])

  const formatted = isDecimal ? display.toFixed(1) : Math.floor(display).toLocaleString()
  return <>{formatted}{suffix}</>
}

export default function SocialProofSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--dark-bg) 0%, #1f2d25 100%)',
        color: 'var(--paper)',
        padding: '72px 0',
      }}
    >
      <div className="mkt-container">
        <motion.div
          style={{ textAlign: 'center', marginBottom: 48 }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="mkt-eyebrow" style={{ color: 'var(--clay-bright)' }}>
            Early traction
          </span>
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 0 }}>
            Learners are already getting results.
          </h2>
        </motion.div>

        <div
          ref={ref}
          className="social-proof-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1, ease: EASE_OUT }}
              whileHover={{ y: -5 }}
              style={{
                padding: '28px 24px',
                borderRadius: 20,
                border: '1px solid rgba(255,250,240,0.1)',
                background: 'rgba(255,250,240,0.04)',
                textAlign: 'center',
                cursor: 'default',
              }}
            >
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                lineHeight: 1,
                marginBottom: 8,
                color: 'var(--clay-bright)',
              }}>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} active={inView} />
              </div>
              <div style={{ fontWeight: 900, fontSize: '0.88rem', color: 'var(--paper)', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--dark-muted)' }}>
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
