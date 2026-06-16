'use client'

import { useEffect, useRef, useState } from 'react'
import { tokenizeText } from '@/lib/word-translations'

const NATIVE_LANG_KEY = 'lexuri-native-lang'

type ChunkDef = {
  text: string
  type: string
  meaning: string
  example: string
  color: string
  translations: Record<string, string>
}

const DEMO_CHUNKS: ChunkDef[] = [
  {
    text: 'take it for granted',
    type: 'Collocation',
    meaning: 'to stop appreciating something because it feels normal',
    example: 'Many people take clean water for granted.',
    color: '#4A90E2',
    translations: {
      'pt-BR': 'dar algo como garantido',
      'es':    'dar algo por sentado',
      'fr':    'tenir pour acquis',
      'de':    'als selbstverständlich betrachten',
      'it':    'dare per scontato',
      'ja':    '当たり前だと思う',
      'ko':    '당연하게 여기다',
      'zh':    '认为理所当然',
      'ar':    'اعتباره أمرًا مسلمًا به',
      'tr':    'doğal karşılamak',
      'ru':    'считать само собой разумеющимся',
      'hi':    'सहज मान लेना',
    },
  },
  {
    text: 'at the end of the day',
    type: 'Idiom',
    meaning: 'when everything important is considered',
    example: 'At the end of the day, consistency matters more than talent.',
    color: '#FF6B6B',
    translations: {
      'pt-BR': 'no fim das contas',
      'es':    'a fin de cuentas',
      'fr':    'en fin de compte',
      'de':    'letzten Endes',
      'it':    'alla fin fine',
      'ja':    '結局のところ',
      'ko':    '결국에는',
      'zh':    '说到底',
      'ar':    'في نهاية المطاف',
      'tr':    'sonuç olarak',
      'ru':    'в конце концов',
      'hi':    'आखिरकार',
    },
  },
  {
    text: 'make sense of',
    type: 'Phrasal verb',
    meaning: 'to understand something confusing',
    example: 'I watched the clip twice to make sense of the argument.',
    color: '#4CAF50',
    translations: {
      'pt-BR': 'entender / compreender',
      'es':    'entender / dar sentido a',
      'fr':    'comprendre / donner du sens à',
      'de':    'verstehen / Sinn ergeben aus',
      'it':    'capire / dare senso a',
      'ja':    '理解する',
      'ko':    '이해하다',
      'zh':    '理解 / 搞明白',
      'ar':    'يفهم / يستوعب',
      'tr':    'anlamını çözmek',
      'ru':    'понять / разобраться',
      'hi':    'समझ पाना',
    },
  },
]

const DEMO_SENTENCE =
  'I used to take it for granted that I could understand English, but at the end of the day I still could not make sense of fast conversations.'

const TEXT_SEGMENTS = [
  'I used to ',
  ' that I could understand English, but ',
  ' I still could not ',
  ' fast conversations.',
]

type TooltipState =
  | { kind: 'chunk'; chunk: ChunkDef; x: number; y: number }
  | { kind: 'word';  word: string;  translation: string; x: number; y: number }

function TextSegment({
  text,
  lang,
  onShow,
  onHide,
}: {
  text: string
  lang: string | null
  onShow: (label: string, translation: string, e: React.MouseEvent<HTMLElement>) => void
  onHide: () => void
}) {
  if (!lang || lang === 'en') return <>{text}</>
  const tokens = tokenizeText(text, lang)
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.kind === 'plain') return <span key={i}>{tok.content}</span>
        const cssClass = tok.kind === 'phrase' ? 'demo-phrase-mark' : 'demo-word-mark'
        return (
          <span
            key={i}
            className={cssClass}
            onMouseEnter={(e) => onShow(tok.content, tok.translation, e)}
            onMouseLeave={onHide}
          >
            {tok.content}
          </span>
        )
      })}
    </>
  )
}

export default function HeroDemo() {
  const [lang, setLang] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [playing, setPlaying] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setLang(localStorage.getItem(NATIVE_LANG_KEY))
    function onLangChange() { setLang(localStorage.getItem(NATIVE_LANG_KEY)) }
    window.addEventListener('lexuri-lang-changed', onLangChange)
    return () => window.removeEventListener('lexuri-lang-changed', onLangChange)
  }, [])

  function showChunkTooltip(chunk: ChunkDef, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(hideTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ kind: 'chunk', chunk, x: rect.left + rect.width / 2, y: rect.top })
  }

  function showWordTooltip(word: string, translation: string, e: React.MouseEvent<HTMLElement>) {
    clearTimeout(hideTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ kind: 'word', word, translation, x: rect.left + rect.width / 2, y: rect.top })
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setTooltip(null), 160)
  }
  function cancelHide() { clearTimeout(hideTimer.current) }

  function playSentence() {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(DEMO_SENTENCE)
    utter.lang = 'en-US'
    utter.onstart = () => setPlaying(true)
    utter.onend   = () => setPlaying(false)
    utter.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utter)
  }

  function stopSpeech() {
    window.speechSynthesis?.cancel()
    setPlaying(false)
  }

  function speakChunk(text: string, e: React.MouseEvent) {
    e.stopPropagation()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(utter)
  }

  const showTranslation = lang && lang !== 'en'

  return (
    <>
      <div className="aha-demo-card animate-fade-up" style={{ animationDelay: '100ms', overflow: 'visible' }}>
        <div className="aha-demo-header">
          <span>Demo lesson</span>
          <strong>18 chunks detected</strong>
        </div>

        <div className="aha-transcript">
          <TextSegment text={TEXT_SEGMENTS[0]} lang={lang} onShow={showWordTooltip} onHide={scheduleHide} />
          <mark
            className="demo-chunk-mark"
            style={{ ['--chunk' as string]: DEMO_CHUNKS[0].color }}
            onMouseEnter={(e) => showChunkTooltip(DEMO_CHUNKS[0], e)}
            onMouseLeave={scheduleHide}
          >{DEMO_CHUNKS[0].text}</mark>
          <TextSegment text={TEXT_SEGMENTS[1]} lang={lang} onShow={showWordTooltip} onHide={scheduleHide} />
          <mark
            className="demo-chunk-mark"
            style={{ ['--chunk' as string]: DEMO_CHUNKS[1].color }}
            onMouseEnter={(e) => showChunkTooltip(DEMO_CHUNKS[1], e)}
            onMouseLeave={scheduleHide}
          >{DEMO_CHUNKS[1].text}</mark>
          <TextSegment text={TEXT_SEGMENTS[2]} lang={lang} onShow={showWordTooltip} onHide={scheduleHide} />
          <mark
            className="demo-chunk-mark"
            style={{ ['--chunk' as string]: DEMO_CHUNKS[2].color }}
            onMouseEnter={(e) => showChunkTooltip(DEMO_CHUNKS[2], e)}
            onMouseLeave={scheduleHide}
          >{DEMO_CHUNKS[2].text}</mark>
          <TextSegment text={TEXT_SEGMENTS[3]} lang={lang} onShow={showWordTooltip} onHide={scheduleHide} />
        </div>

        <div className="demo-audio-bar">
          <button
            className={`demo-audio-btn${playing ? ' demo-audio-playing' : ''}`}
            onClick={playing ? stopSpeech : playSentence}
            aria-label={playing ? 'Stop audio' : 'Listen to sentence'}
          >
            <span className="demo-audio-icon">{playing ? '⏹' : '▶'}</span>
            <span>{playing ? 'Stop' : 'Listen to sentence'}</span>
          </button>
          {showTranslation && (
            <span className="demo-audio-hint">Hover any word or phrase to see translations</span>
          )}
        </div>

        <div className="aha-chunk-grid">
          {DEMO_CHUNKS.map((chunk) => (
            <div key={chunk.text} className="aha-chunk-card" style={{ borderColor: `${chunk.color}66` }}>
              <span style={{ color: chunk.color }}>{chunk.type}</span>
              <h3>{chunk.text}</h3>
              <p>{chunk.meaning}</p>
              {showTranslation && chunk.translations[lang] && (
                <p className="aha-chunk-translation" style={{ color: chunk.color }}>
                  {chunk.translations[lang]}
                </p>
              )}
              <small>{chunk.example}</small>
            </div>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className={`chunk-tooltip-fixed${tooltip.kind === 'word' ? ' word-tooltip' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
          onMouseEnter={cancelHide}
          onMouseLeave={() => setTooltip(null)}
        >
          {tooltip.kind === 'chunk' ? (
            <>
              <div className="chunk-tooltip-header">
                <span className="chunk-type-badge" style={{ color: tooltip.chunk.color }}>
                  {tooltip.chunk.type}
                </span>
                <button
                  className="chunk-speak-btn"
                  onClick={(e) => speakChunk(tooltip.chunk.text, e)}
                  aria-label="Listen to this phrase"
                >
                  🔊
                </button>
              </div>
              {showTranslation && tooltip.chunk.translations[lang] && (
                <strong className="chunk-tooltip-translation">
                  {tooltip.chunk.translations[lang]}
                </strong>
              )}
              <span className="chunk-tooltip-meaning">{tooltip.chunk.meaning}</span>
              <span className="chunk-tooltip-example">{tooltip.chunk.example}</span>
            </>
          ) : (
            <>
              <span className="word-tooltip-label">{tooltip.word}</span>
              <strong className="chunk-tooltip-translation">{tooltip.translation}</strong>
            </>
          )}
        </div>
      )}
    </>
  )
}
