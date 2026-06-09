'use client'

import { useEffect, useState } from 'react'
import { getRankForXP } from '@/lib/gamification'

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

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const PODIUM_SIZES  = [1, 0, 2] // center=1st, left=2nd, right=3rd display order

function UserAvatar({ userId, isMe, size = 36 }: { userId: string; isMe: boolean; size?: number }) {
  const initial = isMe ? 'Y' : userId.slice(0, 1).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: isMe ? 'var(--clay)' : 'rgba(255,250,240,0.12)',
      color: isMe ? '#fff' : 'var(--dark-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.38,
      border: isMe ? '2px solid var(--clay-bright)' : '2px solid var(--dark-border)',
      flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

export default function LeaderboardPage() {
  const [win, setWin] = useState<Window>('alltime')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/gamification/leaderboard?window=${win}`)
      .then((r) => r.json())
      .then((d: LeaderboardData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [win])

  const podium = (data?.entries ?? []).slice(0, 3)
  const rest   = (data?.entries ?? []).slice(3)

  return (
    <>
      {/* Hero */}
      <div className="app-hero">
        <p className="app-hero-subtitle">Community</p>
        <h1 className="app-hero-title">Leaderboard</h1>
        <p className="app-hero-body">
          {data?.my_rank
            ? `You are ranked #${data.my_rank} — keep studying to climb!`
            : 'Complete reviews to earn XP and claim your spot.'}
        </p>
      </div>

      {/* Time window tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['weekly', 'monthly', 'alltime'] as Window[]).map((w) => (
          <button
            key={w}
            onClick={() => setWin(w)}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: `1.5px solid ${win === w ? 'var(--clay)' : 'var(--line)'}`,
              background: win === w ? 'var(--clay)' : 'transparent',
              color: win === w ? '#fff' : 'var(--muted)',
              fontWeight: win === w ? 700 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            {w === 'alltime' ? 'All time' : w === 'weekly' ? 'This week' : 'This month'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 58, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!loading && (data?.entries ?? []).length === 0 && (
        <div className="alert-info">No data yet for this period. Start reviewing to earn XP!</div>
      )}

      {!loading && podium.length > 0 && (
        <>
          {/* ── Podium ──────────────────────────────────────── */}
          <div className="section-title">Top 3</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 28, justifyContent: 'center' }}>
            {PODIUM_SIZES.map((entryIdx) => {
              const entry = podium[entryIdx]
              if (!entry) return <div key={entryIdx} style={{ flex: 1 }} />
              const color = PODIUM_COLORS[entry.rank - 1]
              const isFirst = entry.rank === 1
              const rank = getRankForXP(entry.points)
              return (
                <div
                  key={entry.user_id}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: `${color}12`,
                    border: `1.5px solid ${color}44`,
                    borderRadius: 18,
                    padding: isFirst ? '24px 12px 20px' : '16px 10px 16px',
                    transform: isFirst ? 'translateY(-14px)' : 'none',
                    boxShadow: isFirst ? `0 8px 28px ${color}28` : 'var(--shadow-sm)',
                    transition: 'transform 200ms ease',
                  }}
                >
                  <div style={{ fontSize: isFirst ? '2rem' : '1.4rem', fontWeight: 900, color, marginBottom: 8, lineHeight: 1 }}>
                    {entry.rank}
                  </div>
                  <UserAvatar userId={entry.user_id} isMe={entry.is_me} size={isFirst ? 44 : 36} />
                  <div style={{ marginTop: 8, fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink)' }}>
                    {entry.is_me ? 'You' : entry.user_id.slice(0, 8) + '…'}
                  </div>
                  <div style={{ fontSize: isFirst ? '1rem' : '0.88rem', fontWeight: 900, color, marginTop: 4 }}>
                    {entry.points.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2 }}>XP</div>
                  <div style={{ marginTop: 6, fontSize: '0.65rem', fontWeight: 700, color: rank.color, background: rank.color + '18', borderRadius: 99, padding: '2px 8px', display: 'inline-block' }}>
                    {rank.icon} {rank.label}
                  </div>
                  {entry.streak !== undefined && entry.streak > 0 && (
                    <div style={{ marginTop: 4, fontSize: '0.65rem', color: 'var(--muted)' }}>
                      ◆ {entry.streak}d streak
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Rest of leaderboard ───────────────────────── */}
          {rest.length > 0 && (
            <>
              <div className="section-title">Rankings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rest.map((entry) => {
                  const rank = getRankForXP(entry.points)
                  return (
                    <div
                      key={entry.user_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        borderRadius: 14,
                        border: entry.is_me ? '1.5px solid rgba(200,111,74,0.35)' : '1px solid var(--line)',
                        background: entry.is_me ? 'rgba(200,111,74,0.06)' : '#fff',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'box-shadow 120ms ease',
                      }}
                    >
                      <span style={{ width: 28, fontWeight: 900, fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
                        #{entry.rank}
                      </span>
                      <UserAvatar userId={entry.user_id} isMe={entry.is_me} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: entry.is_me ? 700 : 400, fontSize: '0.88rem', color: entry.is_me ? 'var(--clay)' : 'var(--ink)' }}>
                          {entry.is_me ? 'You' : entry.user_id.slice(0, 12) + '…'}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: rank.color }}>
                          {rank.icon} {rank.label}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--ink)' }}>
                          {entry.points.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>XP</div>
                      </div>
                      {entry.streak !== undefined && entry.streak > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0, marginLeft: 4 }}>
                          ◆ {entry.streak}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
