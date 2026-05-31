'use client'

import { useEffect, useState } from 'react'

type Period = '7d' | '30d' | '90d' | 'alltime'

interface PerformanceData {
  total_reviews: number
  taxa_acerto: number
  tempo_medio: number | null
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
  const [data, setData]     = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const { from, to } = periodToRange(period)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to)   params.set('to', to)
    fetch(`/api/reports/performance?${params}`)
      .then(r => r.json())
      .then((d: PerformanceData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const periods: Period[] = ['7d', '30d', '90d', 'alltime']

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>Performance Reports</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>Your learning stats and progress over time.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {periods.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer',
              background: period === p ? '#333' : '#fff',
              color: period === p ? '#fff' : '#333',
              fontWeight: period === p ? 600 : 400,
            }}
          >
            {p === 'alltime' ? 'All time' : p}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : !data ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No data available.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <Kpi label="Reviews" value={String(data.total_reviews)} sub="in this period" />
          <Kpi label="Accuracy" value={`${data.taxa_acerto}%`} sub="quality ≥ 3" />
          <Kpi label="Avg Response" value={data.tempo_medio !== null ? `${data.tempo_medio}s` : '—'} sub="seconds per card" />
          <Kpi label="Retention" value={data.retention !== null ? `${data.retention}%` : '—'} sub="revisited correctly" />
          <Kpi label="Current Streak" value={`${data.streak} days`} sub="consecutive days" emoji="🔥" />
          <Kpi label="Total Points" value={data.total_points.toLocaleString()} sub="all time" emoji="⭐" />
          <Kpi label="Total Reviews" value={data.total_reviews_alltime.toLocaleString()} sub="all time" />
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value, sub, emoji }: { label: string; value: string; sub: string; emoji?: string }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
      {emoji && <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{emoji}</div>}
      <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 2 }}>{sub}</div>
    </div>
  )
}
