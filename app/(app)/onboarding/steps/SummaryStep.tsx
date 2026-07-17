'use client'

import { recommendedLessons } from '@/lib/product'

interface SummaryStepProps {
  error?: string
}

export default function SummaryStep({ error }: SummaryStepProps) {
  return (
    <div>
      <h1 className="onboard-title">Your first lesson is ready.</h1>
      <p className="onboard-desc">
        Lexuri will start with a guided demo so you can see AI chunks, save your first three expressions, and complete a tiny review before you reach the dashboard.
      </p>
      <div style={{ border: '1px solid var(--auth-border)', borderRadius: 16, padding: 18, marginBottom: 18, background: 'rgba(248,250,252,0.04)' }}>
        <div style={{ color: 'var(--auth-text)', fontWeight: 900, marginBottom: 8 }}>First mission</div>
        <div style={{ display: 'grid', gap: 8, color: 'var(--auth-muted)', fontSize: '0.86rem' }}>
          <span>1. Reveal the AI chunk map</span>
          <span>2. Save three useful chunks</span>
          <span>3. Generate your first cards</span>
          <span>4. Review them once</span>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {recommendedLessons.slice(0, 3).map((lesson) => (
          <div key={lesson.title} className="onboard-summary-row" style={{ border: '1px solid var(--auth-border)', borderRadius: 12 }}>
            <span className="onboard-summary-key">{lesson.source}</span>
            <span className="onboard-summary-val">{lesson.title}</span>
          </div>
        ))}
      </div>
      {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  )
}
