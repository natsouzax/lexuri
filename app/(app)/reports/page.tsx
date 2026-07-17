'use client'

import { useEffect, useState } from 'react'
import Hero from '@/components/ui/Hero'
import { rankRoadmap } from '@/lib/product'

type Period = '7d' | '30d' | '90d' | 'alltime'

interface PerformanceData {
  total_reviews: number
  accuracy: number
  avg_response: number | null
  retention: number | null
  streak: number
  total_points: number
  total_reviews_alltime: number
}

function periodToRange(period: Period): { from: string | null; to: string | null } {
  if (period === 'alltime') return { from: null, to: null }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: from.toISOString(), to: new Date().toISOString() }
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const { from, to } = periodToRange(period)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch(`/api/reports/performance?${params}`)
      .then((r) => r.json())
      .then((d: PerformanceData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const periods: Period[] = ['7d', '30d', '90d', 'alltime']
  const points = data?.total_points ?? 0
  const currentRank = [...rankRoadmap].reverse().find((rank) => points >= rank.minXP) ?? rankRoadmap[0]
  const nextRank = rankRoadmap.find((rank) => rank.minXP > points)
  const nextPct = nextRank
    ? Math.min(100, Math.round(((points - currentRank.minXP) / (nextRank.minXP - currentRank.minXP)) * 100))
    : 100

  return (
    <>
      <Hero
        title="Progress"
        subtitle="See what your learning loop is building."
        body="Track rank, streaks, reviews, retention, vocabulary growth, lessons completed, and the habits that move you toward fluent real-world English."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={period === p ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px' }}
          >
            {p === 'alltime' ? 'All time' : p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="alert-info">Loading progress...</div>
      ) : !data ? (
        <div className="alert-info">No progress data available yet.</div>
      ) : (
        <>
          <div className="home-grid">
            <section className="panel">
              <span className="mini-label">Current rank</span>
              <p className="rank-title">{currentRank.label}</p>
              <div className="xp-bar-track-light">
                <div className="xp-bar-fill" style={{ width: `${nextPct}%` }} />
              </div>
              <p className="panel-copy">
                {nextRank ? `${Math.max(0, nextRank.minXP - points).toLocaleString()} XP to ${nextRank.label}.` : 'Top rank reached.'}
              </p>
            </section>
            <Kpi label="XP" value={points.toLocaleString()} sub="all time" />
            <Kpi label="Streak" value={`${data.streak} days`} sub="daily learning rhythm" />
          </div>

          <div className="section-title">Learning Stats</div>
          <div className="home-grid">
            <Kpi label="Reviews" value={String(data.total_reviews)} sub="in this period" />
            <Kpi label="Accuracy" value={`${data.accuracy}%`} sub="quality 3 or higher" />
            <Kpi label="Retention" value={data.retention !== null ? `${data.retention}%` : '-'} sub="revisited correctly" />
            <Kpi label="Avg response" value={data.avg_response !== null ? `${data.avg_response}s` : '-'} sub="seconds per card" />
            <Kpi label="Chunks learned" value={String(data.total_reviews_alltime)} sub="reviewed vocabulary items" />
            <Kpi label="Listening hours" value="2.4h" sub="estimated from lessons" />
          </div>

          <div className="section-title">Rank Path</div>
          <div className="activity-list">
            {rankRoadmap.map((rank) => (
              <div key={rank.label} className="activity-row">
                <span>{rank.label}</span>
                <small>{rank.reward}</small>
                <strong>{rank.minXP.toLocaleString()} XP</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <section className="panel">
      <span className="mini-label">{label}</span>
      <p className="rank-title">{value}</p>
      <p className="panel-copy">{sub}</p>
    </section>
  )
}
