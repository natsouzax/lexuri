'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang, type Lang } from '@/lib/i18n'
import { SoundOffIcon, SoundOnIcon, TapIcon } from '@/components/ui/Icons'

// Demo interativa da experiência central: a faixa "Happy" toca de fundo
// (via YouTube, autoplay mudo + loop das primeiras linhas), a letra
// sincroniza com o tempo real e os chunks são clicáveis — tocar revela a
// tradução no idioma que a pessoa escolheu no popup. Botão de som.
interface Line {
  at: number // segundo em que a linha entra (timestamp real de Happy)
  before: string
  chunk?: string
  after: string
  /** Tipo + cor do chunk, na mesma paleta do app (lib/chunks.ts COLOR CODES). */
  type?: string
  color?: string
  example?: string
}

const VIDEO_ID = 'ZbZSe6N_BXs'
const LOOP_START = 5
const LOOP_END = 38

const LINES: Line[] = [
  {
    at: 5.5, before: 'It might seem crazy what ', chunk: "I'm 'bout to say", after: '',
    type: 'lexical_chunk', color: '#9C27B0',
    example: "I'm 'bout to leave — call me later.",
  },
  {
    at: 13.0, before: 'Sunshine she’s here, you can ', chunk: 'take a break', after: '',
    type: 'collocation', color: '#4A90E2',
    example: "Let's take a break and come back in ten minutes.",
  },
  {
    at: 24.2, before: 'With the air like I don’t care, baby, ', chunk: 'by the way', after: '',
    type: 'conversational', color: '#607D8B',
    example: 'By the way, did you finish the report?',
  },
  {
    at: 30.7, before: 'Clap along if you feel like a ', chunk: 'room without a roof', after: '',
    type: 'idiomatic', color: '#FF6B6B',
    example: 'Winning that game felt like a room without a roof.',
  },
]

function formatChunkType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function speakChunk(text: string, e: React.MouseEvent) {
  e.stopPropagation()
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
}

// Tradução dos 4 chunks por idioma; fallback = glossa em inglês simples.
const DEMO_TR: Partial<Record<Lang, string[]>> = {
  en: ['what I will say', 'pause / rest', 'incidentally', 'a place with no limits'],
  pt: ['o que vou dizer', 'fazer uma pausa', 'a propósito', 'sala sem teto'],
  es: ['lo que voy a decir', 'tomar un descanso', 'por cierto', 'cuarto sin techo'],
  fr: ['ce que je vais dire', 'faire une pause', 'au fait', 'pièce sans toit'],
  de: ['was ich sagen will', 'eine Pause machen', 'übrigens', 'Raum ohne Dach'],
  it: ['quello che dirò', 'fare una pausa', 'a proposito', 'stanza senza tetto'],
}

interface YTPlayer {
  getCurrentTime(): number
  seekTo(s: number, allow: boolean): void
  mute(): void
  unMute(): void
  setVolume(v: number): void
  playVideo(): void
  destroy(): void
}

// Acesso ao YT sem redeclarar o global (o YoutubeSyncPlayer já o declara).
interface YTApi {
  YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer }
  onYouTubeIframeAPIReady?: () => void
}
function ytWindow(): YTApi {
  return window as unknown as YTApi
}

export default function HeroLyricsDemo() {
  const { lang } = useLang()
  const tr = DEMO_TR[lang] ?? DEMO_TR.en!
  const [active, setActive] = useState(0)
  const [revealed, setRevealed] = useState<number | null>(null)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function init() {
      const yt = ytWindow()
      if (!mountRef.current || !yt.YT?.Player) return
      playerRef.current = new yt.YT.Player(mountRef.current, {
        videoId: VIDEO_ID,
        playerVars: { autoplay: 1, mute: 1, controls: 0, loop: 1, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, fs: 0 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute()
            e.target.seekTo(LOOP_START, true)
            e.target.playVideo()
            setReady(true)
            const tick = () => {
              const p = playerRef.current
              if (p) {
                let t = p.getCurrentTime()
                if (t >= LOOP_END || t < LOOP_START - 1) { p.seekTo(LOOP_START, true); t = LOOP_START }
                let idx = 0
                for (let i = 0; i < LINES.length; i++) if (t >= LINES[i].at) idx = i
                setActive(idx)
              }
              rafRef.current = requestAnimationFrame(tick)
            }
            rafRef.current = requestAnimationFrame(tick)
          },
        },
      })
    }

    if (ytWindow().YT?.Player) {
      init()
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
      ytWindow().onYouTubeIframeAPIReady = init
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  function toggleSound() {
    const p = playerRef.current
    if (!p) return
    if (muted) { p.unMute(); p.setVolume(70); setMuted(false) }
    else { p.mute(); setMuted(true) }
  }

  function handleChunk(i: number) {
    setRevealed((r) => (r === i ? null : i))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: -1.2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'linear-gradient(135deg, var(--dark-surface) 0%, var(--dark-bg) 55%, #0d130f 130%)',
        border: '1px solid var(--dark-border)',
        borderRadius: 22,
        padding: '22px 24px 20px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: 440,
        position: 'relative',
      }}
    >
      {/* Player do YouTube — presente mas invisível (só o áudio importa) */}
      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div ref={mountRef} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 18 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--clay-bright)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--butter)' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)' }} />
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: 'var(--dark-muted)' }}>
          ♪ Happy — Pharrell Williams
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 176 }}>
        {LINES.map((line, i) => {
          const isActive = i === active
          return (
            <div key={i}>
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
                    {line.chunk}
                  </button>
                )}
                {line.after}
              </p>

              {/* Mesmo card do app (classes .chunk-tooltip-*), só que ancorado
                  embaixo da linha em vez de flutuando sobre o vídeo. */}
              <AnimatePresence>
                {revealed === i && line.chunk && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="chunk-tooltip-fixed chunk-tooltip-inline">
                      <div className="chunk-tooltip-header">
                        <span className="chunk-type-badge" style={{ color: line.color }}>
                          {formatChunkType(line.type ?? '')}
                        </span>
                        <button
                          type="button"
                          className="chunk-speak-btn"
                          onClick={(e) => speakChunk(line.chunk!, e)}
                          title="Listen"
                          aria-label={`Listen to ${line.chunk}`}
                        >
                          <SoundOnIcon size={14} />
                        </button>
                      </div>
                      <strong className="chunk-tooltip-translation">{tr[i]}</strong>
                      {lang !== 'en' && (
                        <span className="chunk-tooltip-meaning">{DEMO_TR.en![i]}</span>
                      )}
                      {line.example && (
                        <span className="chunk-tooltip-example">{line.example}</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Controles: som + faixa de progresso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <button
          onClick={toggleSound}
          aria-label={muted ? 'Unmute' : 'Mute'}
          title={muted ? 'Play with sound' : 'Mute'}
          style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: muted ? 'rgba(255,250,240,0.1)' : 'var(--clay)',
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 200ms ease',
          }}
        >
          {muted ? <SoundOffIcon size={15} /> : <SoundOnIcon size={15} />}
        </button>
        <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,250,240,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${((active + 1) / LINES.length) * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--clay), var(--butter))', transition: 'width 500ms ease' }} />
        </div>
      </div>

      <p style={{ margin: '12px 0 0', fontSize: '0.68rem', color: 'var(--dark-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
        {muted && ready && (
          <>
            <SoundOffIcon size={11} /> tap the speaker for sound ·{' '}
          </>
        )}
        <TapIcon size={11} /> tap a highlighted phrase
      </p>
    </motion.div>
  )
}
