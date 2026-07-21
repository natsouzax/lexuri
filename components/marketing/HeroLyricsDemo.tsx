'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Demo interativa da experiência central: a letra avança sozinha (linha
// ativa em destaque, como no player real) e os chunks são clicáveis —
// tocar revela a tradução, mostrando o diferencial sem precisar logar.
interface Line {
  before: string
  chunk?: { text: string; tr: string }
  after: string
}

const LINES: Line[] = [
  { before: 'It might seem crazy what ', chunk: { text: "I'm 'bout to say", tr: 'o que estou prestes a dizer' }, after: '' },
  { before: 'Sunshine she’s here, you can ', chunk: { text: 'take a break', tr: 'fazer uma pausa' }, after: '' },
  { before: 'Clap along if you feel like a ', chunk: { text: 'room without a roof', tr: 'sala sem teto (sem limites)' }, after: '' },
  { before: 'Because I’m ', chunk: { text: 'happy', tr: 'feliz' }, after: '' },
]

export default function HeroLyricsDemo() {
  const [active, setActive] = useState(2)
  const [revealed, setRevealed] = useState<number | null>(2)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    timer.current = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % LINES.length
        setRevealed(null)
        return next
      })
    }, 2600)
    return () => clearInterval(timer.current)
  }, [])

  function handleChunk(i: number) {
    clearInterval(timer.current)
    setActive(i)
    setRevealed((r) => (r === i ? null : i))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: -1.2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--dark-surface)',
        border: '1px solid var(--dark-border)',
        borderRadius: 22,
        padding: '22px 24px 20px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: 440,
      }}
    >
      {/* barra de janela + faixa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clay-bright)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--butter)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dark-muted)' }}>
          ♪ Happy — Pharrell Williams
        </span>
      </div>

      {/* letra karaokê */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 176 }}>
        {LINES.map((line, i) => {
          const isActive = i === active
          return (
            <div key={i} style={{ transition: 'opacity 400ms ease' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: isActive ? '1.05rem' : '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1.4,
                  color: isActive ? 'var(--paper)' : 'rgba(255,250,240,0.32)',
                  transition: 'all 400ms ease',
                }}
              >
                {line.before}
                {line.chunk && (
                  <button
                    onClick={() => handleChunk(i)}
                    style={{
                      display: 'inline',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 6,
                      padding: '1px 6px',
                      fontWeight: 800,
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      background: isActive ? 'rgba(246,202,95,0.22)' : 'rgba(246,202,95,0.1)',
                      color: isActive ? 'var(--butter)' : 'rgba(246,202,95,0.55)',
                      transition: 'all 300ms ease',
                    }}
                  >
                    {line.chunk.text}
                  </button>
                )}
                {line.after}
              </p>

              <AnimatePresence>
                {revealed === i && line.chunk && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 6,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--clay-bright)',
                        background: 'rgba(217,123,84,0.14)',
                        borderRadius: 8,
                        padding: '3px 10px',
                      }}
                    >
                      🌐 {line.chunk.tr}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* player fake */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--clay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff' }}>▶</span>
        <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,250,240,0.12)', overflow: 'hidden' }}>
          <motion.div
            key={active}
            initial={{ width: '8%' }}
            animate={{ width: `${((active + 1) / LINES.length) * 100}%` }}
            transition={{ duration: 2.4, ease: 'linear' }}
            style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--clay), var(--butter))' }}
          />
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--dark-muted)' }}>0:{(active + 1) * 15}</span>
      </div>

      <p style={{ margin: '12px 0 0', fontSize: '0.68rem', color: 'var(--dark-muted)', textAlign: 'center' }}>
        👆 tap a highlighted phrase
      </p>
    </motion.div>
  )
}
