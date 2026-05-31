'use client'

import { useEffect, useState } from 'react'

type Window = 'weekly' | 'monthly' | 'alltime'

interface Entry {
  rank: number
  user_id: string
  points: number
  streak?: number
  total_reviews?: number
  is_me: boolean
}

interface LeaderboardData {
  window: string
  page: number
  entries: Entry[]
  my_rank: number | null
}

export default function LeaderboardPage() {
  const [window, setWindow] = useState<Window>('alltime')
  const [data, setData]     = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/gamification/leaderboard?window=${window}`)
      .then(r => r.json())
      .then((d: LeaderboardData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [window])

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 }}>Leaderboard</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        {data?.my_rank ? `Your rank: #${data.my_rank}` : 'Complete reviews to earn points!'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['weekly', 'monthly', 'alltime'] as Window[]).map(w => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid #ddd', cursor: 'pointer',
              background: window === w ? '#333' : '#fff',
              color: window === w ? '#fff' : '#333',
              fontWeight: window === w ? 600 : 400,
            }}
          >
            {w === 'alltime' ? 'All time' : w.charAt(0).toUpperCase() + w.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : (
        <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
          {(data?.entries ?? []).map(entry => (
            <div
              key={entry.user_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                background: entry.is_me ? '#f0f7ff' : '#fff',
              }}
            >
              <span style={{ fontWeight: 700, width: 28, color: entry.rank <= 3 ? '#c77b2a' : '#333' }}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: entry.is_me ? 700 : 400 }}>
                  {entry.is_me ? 'You' : entry.user_id.slice(0, 8) + '…'}
                </span>
              </div>
              <span style={{ fontWeight: 600, color: '#333' }}>{entry.points.toLocaleString()} pts</span>
              {entry.streak !== undefined && (
                <span style={{ fontSize: '0.78rem', color: '#888' }}>🔥 {entry.streak}</span>
              )}
            </div>
          ))}
          {(data?.entries ?? []).length === 0 && (
            <p style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No data yet for this period.</p>
          )}
        </div>
      )}
    </div>
  )
}
