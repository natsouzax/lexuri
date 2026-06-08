import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lexuri — Learn English from real content',
  description: 'AI-powered language learning. Turn videos, music, and transcripts into fluency — through chunks, not word lists.',
}

const FEATURES = [
  {
    icon: '▶',
    iconBg: 'rgba(70,98,74,0.15)',
    iconColor: '#46624a',
    title: 'Video + Transcript',
    body: 'Load any YouTube video. The transcript syncs word by word as you watch. Click to collect words in context.',
  },
  {
    icon: '◈',
    iconBg: 'rgba(200,111,74,0.12)',
    iconColor: '#c86f4a',
    title: 'Language Chunk Detection',
    body: 'AI identifies phrasal verbs, idioms, collocations, and formulaic sequences — the units your brain actually stores.',
  },
  {
    icon: '⊞',
    iconBg: 'rgba(74,144,226,0.12)',
    iconColor: '#4a90e2',
    title: 'Smart Flashcards',
    body: 'Every chunk becomes a flashcard with contextual translation, example, and explanation. No manual entry.',
  },
  {
    icon: '↻',
    iconBg: 'rgba(156,39,176,0.1)',
    iconColor: '#9c27b0',
    title: 'Spaced Repetition',
    body: 'The SM-2 algorithm shows you each card at exactly the right moment — right before you forget it.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Load real content',
    body: 'Paste a YouTube URL or search for a song. Lexuri fetches the transcript automatically.',
  },
  {
    n: '02',
    title: 'AI detects the chunks',
    body: 'Instead of flagging random hard words, the AI identifies natural language units: phrasal verbs, idioms, collocations — exactly how English is stored in your brain.',
  },
  {
    n: '03',
    title: 'Review and retain',
    body: 'Chunks become flashcards. The spaced repetition system schedules each review at the optimal moment for long-term retention.',
  },
]

const FEED_PREVIEW = [
  {
    type: 'video',
    level: 'B2',
    levelColor: '#FF9800',
    source: 'TED',
    title: 'How Great Leaders Inspire Action',
    tags: ['leadership', 'collocations'],
    thumbBg: 'linear-gradient(135deg, #2e4a2e 0%, #1a3020 100%)',
  },
  {
    type: 'video',
    level: 'B1',
    levelColor: '#FF9800',
    source: 'TED',
    title: 'Try Something New for 30 Days',
    tags: ['motivation', 'everyday English'],
    thumbBg: 'linear-gradient(135deg, #1a3040 0%, #0d1f30 100%)',
  },
  {
    type: 'music',
    level: 'A2',
    levelColor: '#4CAF50',
    source: 'Bruno Mars',
    title: 'Count on Me',
    tags: ['pop', 'phrasal verbs'],
    thumbBg: 'linear-gradient(135deg, #3a1050 0%, #1a0828 100%)',
  },
]

const FEED_BULLETS = [
  ['◈', 'Filtered by CEFR level: A2, B1, B2, and C1'],
  ['▶', 'Videos and music in one unified feed'],
  ['★', 'Save items to your personal study queue'],
  ['⊞', 'Open any item directly in YouTube Studio or Music Lab'],
] as const

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="mkt-section-dark mkt-hero-section">
        <div className="mkt-container mkt-grid-hero">
          <div className="animate-fade-up">
            <span className="mkt-eyebrow">AI-Powered Language Learning</span>
            <h1 className="mkt-h1" style={{ color: 'var(--paper)' }}>
              Learn English from the content you already love.
            </h1>
            <p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 36 }}>
              Stop memorizing word lists. Lexuri detects the natural language chunks in videos and music — the phrases, idioms, and patterns that build real fluency.
            </p>
            <div className="mkt-btn-group">
              <Link href="/youtube" className="btn-mkt-primary">Start learning free →</Link>
              <Link href="/features" className="btn-mkt-ghost">See how it works</Link>
            </div>
          </div>

          {/* Mockup */}
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="hero-mockup">
              <div className="hero-mockup-bar">
                <div className="hero-mockup-dot" style={{ background: '#ff5f57' }} />
                <div className="hero-mockup-dot" style={{ background: '#febc2e' }} />
                <div className="hero-mockup-dot" style={{ background: '#28c840' }} />
                <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'var(--dark-muted)', fontWeight: 700 }}>Chunk Map</span>
              </div>
              <div style={{ padding: '20px 24px', lineHeight: 2.2, fontSize: '0.9rem', color: 'rgba(255,250,240,0.85)' }}>
                {'I\'ve been '}
                <span style={{ background: '#E91E6333', borderBottom: '2px solid #E91E63', padding: '1px 3px', borderRadius: 3 }}>kind of freaking out</span>
                {' lately, you know? I just '}
                <span style={{ background: '#4CAF5033', borderBottom: '2px solid #4CAF50', padding: '1px 3px', borderRadius: 3 }}>give up</span>
                {' trying to '}
                <span style={{ background: '#4A90E233', borderBottom: '2px solid #4A90E2', padding: '1px 3px', borderRadius: 3 }}>make sense of</span>
                {' it all. '}
                <span style={{ background: '#FF6B6B33', borderBottom: '2px solid #FF6B6B', padding: '1px 3px', borderRadius: 3 }}>At the end of the day</span>
                {' it\'s all about perspective.'}
              </div>
              <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Emotional', color: '#E91E63' },
                  { label: 'Phrasal Verb', color: '#4CAF50' },
                  { label: 'Collocation', color: '#4A90E2' },
                  { label: 'Idiom', color: '#FF6B6B' },
                ].map(({ label, color }) => (
                  <span key={label} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: color + '22', color }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="mkt-eyebrow">The Method</span>
            <h2 className="mkt-h2">Three steps to real fluency</h2>
            <p className="mkt-lead" style={{ margin: '0 auto' }}>
              No vocabulary lists. No grammar drills. Just language the way your brain was designed to learn it.
            </p>
          </div>
          <div className="mkt-grid-3col">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="step-number">{step.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 8px' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why chunks beat words ─────────────────────────── */}
      <section className="mkt-section mkt-section-sage">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="mkt-eyebrow">The Science</span>
            <h2 className="mkt-h2">Why word lists don&apos;t work</h2>
          </div>
          <div className="mkt-grid-2col mkt-comparison">
            <div style={{ border: '1px solid rgba(200,80,60,0.25)', borderRadius: 20, padding: '28px 28px', background: 'rgba(200,80,60,0.05)' }}>
              <div style={{ fontWeight: 900, marginBottom: 16, fontSize: '0.85rem', color: '#b03020' }}>✕ Traditional approach</div>
              {['Memorize isolated words', 'No context or emotion', 'Forget within days', 'Can\'t speak naturally', 'Grammar rules, not patterns'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.88rem', color: 'var(--muted)' }}>
                  <span style={{ color: '#b03020', fontWeight: 900 }}>–</span> {t}
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid rgba(70,98,74,0.35)', borderRadius: 20, padding: '28px 28px', background: 'rgba(70,98,74,0.07)' }}>
              <div style={{ fontWeight: 900, marginBottom: 16, fontSize: '0.85rem', color: 'var(--moss)' }}>✓ Lexuri approach</div>
              {['Learn in natural chunks', 'Real context from content you love', 'Spaced repetition for retention', 'Phrases ready to use', 'How the brain actually stores language'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: '0.88rem', color: 'var(--ink)' }}>
                  <span style={{ color: 'var(--moss)', fontWeight: 900, flexShrink: 0 }}>✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────── */}
      <section className="mkt-section mkt-section-cream">
        <div className="mkt-container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="mkt-eyebrow">What&apos;s Inside</span>
            <h2 className="mkt-h2">Everything you need to reach fluency</h2>
          </div>
          <div className="mkt-grid-2col">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Learning Feed ─────────────────────────────────── */}
      <section className="mkt-section mkt-section-dark">
        <div className="mkt-container">
          <div className="mkt-feature-row">
            {/* Left: copy */}
            <div className="animate-fade-up">
              <span className="mkt-eyebrow">Learning Feed</span>
              <h2 className="mkt-h2" style={{ color: 'var(--paper)' }}>
                A social feed built around real English.
              </h2>
              <p className="mkt-lead mkt-lead-dark" style={{ marginBottom: 28 }}>
                Discover curated TED talks, YouTube videos, and music tracks — organized by CEFR level. See what the learning community is studying, save what resonates, and jump straight into chunk extraction.
              </p>
              {FEED_BULLETS.map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <span style={{ color: 'var(--clay-bright)', fontWeight: 900, fontSize: '0.88rem', flexShrink: 0, marginTop: 2 }}>{icon}</span>
                  <span style={{ color: 'var(--dark-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
              <div style={{ marginTop: 28 }}>
                <Link href="/feed" className="btn-mkt-primary">Browse the feed →</Link>
              </div>
            </div>

            {/* Right: feed card mockup */}
            <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FEED_PREVIEW.map((item, i) => (
                  <div key={i} style={{
                    border: '1px solid var(--dark-border)',
                    borderRadius: 14,
                    background: 'var(--dark-surface)',
                    display: 'flex',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 80,
                      flexShrink: 0,
                      background: item.thumbBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      position: 'relative',
                      color: 'rgba(255,250,240,0.6)',
                    }}>
                      {item.type === 'music' ? '♪' : '▶'}
                      <span style={{
                        position: 'absolute', top: 5, left: 5,
                        background: item.levelColor,
                        color: '#fff', fontSize: '0.52rem', fontWeight: 900,
                        padding: '2px 6px', borderRadius: 99, letterSpacing: '0.05em',
                      }}>
                        {item.level}
                      </span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '10px 14px', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.58rem', color: 'var(--dark-muted)', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {item.source}
                      </div>
                      <div style={{ fontFamily: 'Fraunces,Georgia,serif', fontWeight: 900, fontSize: '0.85rem', color: 'var(--paper)', lineHeight: 1.25, marginBottom: 6 }}>
                        {item.title}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {item.tags.map((tag) => (
                          <span key={tag} style={{
                            fontSize: '0.58rem', fontWeight: 700,
                            padding: '2px 7px', borderRadius: 99,
                            background: 'rgba(70,98,74,0.3)', color: '#a0d0a0',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Level filter pills mockup */}
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {['All levels', 'A2', 'B1', 'B2', 'C1'].map((l, i) => (
                  <span key={l} style={{
                    padding: '5px 13px',
                    borderRadius: 999,
                    border: `1.5px solid ${i === 0 ? 'var(--clay-bright)' : 'var(--dark-border)'}`,
                    background: i === 0 ? 'var(--clay-bright)' : 'transparent',
                    color: i === 0 ? '#fff' : 'var(--dark-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials placeholder ───────────────────────── */}
      <section className="mkt-section mkt-section-dark">
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow">Learners</span>
          <h2 className="mkt-h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>
            Real results from real learners
          </h2>
          <p className="mkt-lead mkt-lead-dark" style={{ margin: '0 auto 48px' }}>
            Lexuri is in early access. Testimonials coming soon.
          </p>
          <div className="mkt-grid-3col">
            {['B2 level in 6 months', 'Finally understood series without subtitles', 'Chunks made all the difference'].map((quote, i) => (
              <div key={i} style={{ border: '1px solid var(--dark-border)', borderRadius: 20, padding: '28px 24px', background: 'var(--dark-surface)', textAlign: 'left' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 12 }}>✦</div>
                <p style={{ color: 'var(--dark-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic' }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div style={{ width: 48, height: 6, borderRadius: 99, background: 'var(--clay-bright)', opacity: 0.5 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="mkt-section" style={{ background: 'linear-gradient(135deg, var(--clay) 0%, #8B3A1E 100%)', color: '#fff' }}>
        <div className="mkt-container" style={{ textAlign: 'center' }}>
          <span className="mkt-eyebrow" style={{ color: 'rgba(255,250,240,0.7)' }}>Get Started</span>
          <h2 className="mkt-h2" style={{ color: '#fff', marginBottom: 16 }}>
            Start learning smarter today.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,250,240,0.75)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Lexuri is free to start. No credit card. No downloads. Just open the app and load your first video.
          </p>
          <Link href="/youtube" className="btn-mkt-ghost" style={{ borderColor: 'rgba(255,250,240,0.5)', color: '#fff', fontSize: '1rem', padding: '15px 36px' }}>
            Open Lexuri — it&apos;s free →
          </Link>
        </div>
      </section>
    </>
  )
}
