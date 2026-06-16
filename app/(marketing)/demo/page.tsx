'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ChunkHighlighter from '@/components/ui/ChunkHighlighter'
import ChunkCard from '@/components/ui/ChunkCard'
import type { ChunkItem } from '@/lib/types'

const NATIVE_LANG_KEY = 'lexuri-native-lang'

const DEMO_TEXT =
  "Is there something you've always meant to do, wanted to do, but just haven't? " +
  "Matt Cutts suggests a simple idea: try something new for 30 days. " +
  "It turns out 30 days is just the right amount of time to add a new habit " +
  "or subtract a habit from your life. Think about it — small steps, done " +
  "consistently, can make a remarkable difference."

function pos(phrase: string): { start: number; end: number } {
  const start = DEMO_TEXT.indexOf(phrase)
  return { start, end: start + phrase.length }
}

const DEMO_CHUNKS: ChunkItem[] = [
  {
    text: "always meant to do",
    type: "collocation",
    ...pos("always meant to do"),
    literal_translation: "always intended to do",
    contextual_translation: "always wanted to / had been meaning to do",
    importance: "high",
    frequency_score: 8,
    confidence: 0.92,
    color: "#4A90E2",
    clickable: true,
    flashcard_suggestion: true,
    learner_level: "B1",
    why_it_matters:
      "Expresses long-held unfulfilled intention. Very common in spoken English when reflecting on postponed plans.",
  },
  {
    text: "just haven't",
    type: "conversational",
    ...pos("just haven't"),
    literal_translation: "simply did not",
    contextual_translation: "just never got around to it / simply never did",
    importance: "medium",
    frequency_score: 9,
    confidence: 0.88,
    color: "#607D8B",
    clickable: true,
    flashcard_suggestion: false,
    learner_level: "B1",
    why_it_matters:
      '"Just" softens a negative. This dismissive structure is extremely common in informal spoken English.',
  },
  {
    text: "try something new",
    type: "lexical_chunk",
    ...pos("try something new"),
    literal_translation: "attempt something new",
    contextual_translation: "try / experiment with something new",
    importance: "high",
    frequency_score: 9,
    confidence: 0.95,
    color: "#9C27B0",
    clickable: true,
    flashcard_suggestion: true,
    learner_level: "A2",
    why_it_matters:
      "Core lexical chunk for expressing experimentation. Used across personal, professional, and creative contexts.",
  },
  {
    text: "just the right amount of time",
    type: "formulaic",
    ...pos("just the right amount of time"),
    literal_translation: "exactly the right amount of time",
    contextual_translation: "the perfect amount of time / just enough time",
    importance: "high",
    frequency_score: 7,
    confidence: 0.85,
    color: "#FF9800",
    clickable: true,
    flashcard_suggestion: true,
    learner_level: "B2",
    why_it_matters:
      'The pattern "just the right + noun" is a formulaic intensifier expressing precision. Very productive in English.',
  },
  {
    text: "add a new habit",
    type: "collocation",
    ...pos("add a new habit"),
    literal_translation: "add a new habit",
    contextual_translation: "build / incorporate a new habit",
    importance: "medium",
    frequency_score: 7,
    confidence: 0.87,
    color: "#4CAF50",
    clickable: true,
    flashcard_suggestion: true,
    learner_level: "B1",
    why_it_matters:
      '"Add" collocates naturally with "habit". Native speakers say "add a habit", not "make" or "put" one.',
  },
]

// Per-language translations for each demo chunk
const CHUNK_NATIVE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'always meant to do': {
    'pt-BR': 'sempre quis fazer',
    'es':    'siempre pensé en hacer',
    'fr':    "j'avais toujours voulu faire",
    'de':    'hatte immer geplant zu tun',
    'it':    'avevo sempre intenzione di fare',
    'ja':    'ずっとやろうと思っていた',
    'ko':    '늘 하려고 했던',
    'zh':    '一直打算做的',
    'ar':    'كنت دائماً أنوي القيام به',
    'tr':    'her zaman yapmayı düşündüm',
    'ru':    'всегда собирался сделать',
    'hi':    'हमेशा करने का इरादा था',
  },
  "just haven't": {
    'pt-BR': 'simplesmente não fiz',
    'es':    'simplemente no lo hice',
    'fr':    "n'ai tout simplement pas fait",
    'de':    'einfach nicht getan',
    'it':    'semplicemente non l\'ho fatto',
    'ja':    'ただやらなかった',
    'ko':    '그냥 하지 않았다',
    'zh':    '就是没去做',
    'ar':    'لم أفعله فحسب',
    'tr':    'sadece yapmadım',
    'ru':    'просто не сделал',
    'hi':    'बस नहीं किया',
  },
  'try something new': {
    'pt-BR': 'tentar algo novo',
    'es':    'probar algo nuevo',
    'fr':    'essayer quelque chose de nouveau',
    'de':    'etwas Neues ausprobieren',
    'it':    'provare qualcosa di nuovo',
    'ja':    '新しいことを試す',
    'ko':    '새로운 것을 시도하다',
    'zh':    '尝试新事物',
    'ar':    'تجربة شيء جديد',
    'tr':    'yeni bir şey denemek',
    'ru':    'попробовать что-то новое',
    'hi':    'कुछ नया आज़माना',
  },
  'just the right amount of time': {
    'pt-BR': 'exatamente o tempo certo',
    'es':    'justo la cantidad correcta de tiempo',
    'fr':    'exactement la bonne durée',
    'de':    'genau die richtige Menge Zeit',
    'it':    'esattamente il tempo giusto',
    'ja':    'ちょうどいい期間',
    'ko':    '딱 알맞은 시간',
    'zh':    '恰好合适的时间',
    'ar':    'المقدار المناسب من الوقت تماماً',
    'tr':    'tam doğru süre',
    'ru':    'ровно столько времени',
    'hi':    'बिल्कुल सही समय की मात्रा',
  },
  'add a new habit': {
    'pt-BR': 'adquirir um novo hábito',
    'es':    'adquirir un nuevo hábito',
    'fr':    'adopter une nouvelle habitude',
    'de':    'eine neue Gewohnheit aufbauen',
    'it':    'acquisire una nuova abitudine',
    'ja':    '新しい習慣を取り入れる',
    'ko':    '새로운 습관을 만들다',
    'zh':    '养成一个新习惯',
    'ar':    'إضافة عادة جديدة',
    'tr':    'yeni bir alışkanlık edinmek',
    'ru':    'приобрести новую привычку',
    'hi':    'एक नई आदत जोड़ना',
  },
}

export default function DemoPage() {
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => {
    setLang(localStorage.getItem(NATIVE_LANG_KEY))
    function onLangChange() { setLang(localStorage.getItem(NATIVE_LANG_KEY)) }
    window.addEventListener('lexuri-lang-changed', onLangChange)
    return () => window.removeEventListener('lexuri-lang-changed', onLangChange)
  }, [])

  // Build the per-chunk native-translation map for the current language
  const nativeTranslations: Record<string, string> = {}
  if (lang && lang !== 'en') {
    for (const [chunkText, langs] of Object.entries(CHUNK_NATIVE_TRANSLATIONS)) {
      if (langs[lang]) nativeTranslations[chunkText] = langs[lang]
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="mkt-section mkt-section-sage" style={{ paddingBottom: 0 }}>
        <div className="mkt-container" style={{ textAlign: 'center', paddingBottom: 48 }}>
          <span className="mkt-eyebrow">Live Demo</span>
          <h1 className="mkt-h1" style={{ marginBottom: 16 }}>
            See Lexuri in action.
          </h1>
          <p className="mkt-lead" style={{ margin: '0 auto 32px' }}>
            This is a real chunk analysis of a TED talk. The highlighted text shows the
            natural language patterns detected by Lexuri&apos;s AI — the phrases, idioms, and
            collocations that build actual fluency.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: '#FF980022', color: '#FF9800', border: '1px solid #FF980040' }}>
              B1 Level
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: 'rgba(70,98,74,0.15)', color: 'var(--moss)' }}>
              TED · Matt Cutts
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: 'rgba(70,98,74,0.15)', color: 'var(--moss)' }}>
              3:27
            </span>
          </div>
        </div>
      </section>

      {/* Transcript + chunks */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          {/* Transcript panel */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Transcript — chunk map</span>
              {lang && lang !== 'en' && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--clay)', textTransform: 'none', letterSpacing: 0 }}>
                  Hover any word or phrase to see translations
                </span>
              )}
            </div>
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: '24px 28px',
                marginBottom: 24,
              }}
            >
              <ChunkHighlighter
                text={DEMO_TEXT}
                chunks={DEMO_CHUNKS}
                selectedChunk={selectedChunk}
                onChunkClick={setSelectedChunk}
                lang={lang}
                nativeTranslations={nativeTranslations}
              />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {[
              { label: 'Collocation', color: '#4A90E2' },
              { label: 'Conversational', color: '#607D8B' },
              { label: 'Lexical Chunk', color: '#9C27B0' },
              { label: 'Formulaic', color: '#FF9800' },
            ].map(({ label, color }) => (
              <span
                key={label}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 11px',
                  borderRadius: 20,
                  background: color + '22',
                  color,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Chunk cards */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Detected chunks — click to highlight
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14,
                marginBottom: 48,
              }}
            >
              {DEMO_CHUNKS.map((chunk) => (
                <ChunkCard
                  key={chunk.text}
                  chunk={chunk}
                  isSelected={selectedChunk?.text === chunk.text}
                  onSelect={setSelectedChunk}
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--clay) 0%, #8B3A1E 100%)',
              borderRadius: 20,
              padding: '40px 36px',
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <h2
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontWeight: 900,
                fontSize: '1.6rem',
                marginBottom: 12,
                color: '#fff',
              }}
            >
              Turn any video into a lesson like this.
            </h2>
            <p style={{ color: 'rgba(255,250,240,0.8)', marginBottom: 28, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Create a free account and analyze any YouTube video or song. Lexuri detects the
              chunks, you save the ones that matter, and our spaced repetition system makes sure
              you never forget them.
            </p>
            <Link
              href="/register"
              className="btn-mkt-ghost"
              style={{ borderColor: 'rgba(255,250,240,0.6)', color: '#fff', fontSize: '0.95rem', padding: '13px 32px' }}
            >
              Create your free account and save these chunks →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
