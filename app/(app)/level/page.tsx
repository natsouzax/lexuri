import Link from 'next/link'

// Substitui o onboarding de vários passos: um pick rápido de nível que já
// abre uma lição de verdade, no nível certo — sem quiz, sem fricção.
const LEVELS = [
  {
    icon: '🌱',
    title: 'Beginner',
    desc: 'I know some words, but full sentences are hard to follow.',
    lessonId: 'music-happy',
  },
  {
    icon: '🌿',
    title: 'Intermediate',
    desc: "I can follow along, but I miss a lot of the details.",
    lessonId: 'music-fix-you',
  },
  {
    icon: '🌳',
    title: 'Advanced',
    desc: 'I understand most of it — I just want to sound more natural.',
    lessonId: 'video-veritasium-parallel',
  },
]

export default function LevelPage() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px' }}>
      <div className="app-hero" style={{ textAlign: 'center' }}>
        <h1 className="app-hero-title">What&apos;s your English level?</h1>
        <p className="app-hero-subtitle">We&apos;ll open a real lesson that matches where you&apos;re at.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
        {LEVELS.map((l) => (
          <Link key={l.title} href={`/feed/${l.lessonId}`} style={{ textDecoration: 'none' }}>
            <div className="settings-nav-card">
              <span className="settings-nav-icon">{l.icon}</span>
              <div>
                <div className="settings-nav-title">{l.title}</div>
                <div className="settings-nav-desc">{l.desc}</div>
              </div>
              <span className="settings-nav-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
