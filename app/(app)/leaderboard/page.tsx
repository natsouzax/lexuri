'use client'

import { useEffect, useState } from 'react'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'
import { FlameIcon, ListIcon, StarIcon, TrophyIcon } from '@/components/ui/Icons'
import { getRankForXP } from '@/lib/gamification'

type Window = 'weekly' | 'monthly' | 'alltime'

interface Entry {
  rank: number
  user_id: string
  display_name: string | null
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

const WINDOW_LABELS: Record<Window, string> = {
  weekly: 'This week',
  monthly: 'This month',
  alltime: 'All time',
}

function UserAvatar({ displayName, isMe, size = 36 }: { displayName: string | null; isMe: boolean; size?: number }) {
  const initial = (displayName?.trim()[0] ?? '?').toUpperCase()
  return (
    <div
      className={`lb-avatar${isMe ? ' is-me' : ''}`}
      style={{ '--avatar-size': `${size}px` } as React.CSSProperties}
    >
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

  const entries = data?.entries ?? []
  const podium = entries.slice(0, 3)
  const rest   = entries.slice(3)
  const me     = entries.find((e) => e.is_me)

  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <p className="app-hero-subtitle">Community</p>
          <h1 className="app-hero-title">Leaderboard</h1>
          <p className="app-hero-body">
            {data?.my_rank
              ? `You are ranked #${data.my_rank} — keep studying to climb!`
              : 'Complete reviews to earn XP and claim your spot.'}
          </p>
        </div>

        <div className="stat-pill-row">
          <div className="stat-pill">
            <span className="stat-pill-icon clay"><TrophyIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{data?.my_rank ? `#${data.my_rank}` : 'Unranked'}</span>
              <span className="stat-pill-label">Your position</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon butter"><StarIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{me ? `${me.points.toLocaleString()} XP` : '—'}</span>
              <span className="stat-pill-label">Points earned</span>
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-icon" style={{ background: 'var(--sage)', color: 'var(--moss)' }}><ListIcon size={17} /></span>
            <span className="stat-pill-text">
              <span className="stat-pill-value">{entries.length} learners</span>
              <span className="stat-pill-label">{WINDOW_LABELS[win]}</span>
            </span>
          </div>
        </div>

        <div className="badges-tabs">
          {(['weekly', 'monthly', 'alltime'] as Window[]).map((w) => (
            <button
              key={w}
              type="button"
              className={`badges-tab${win === w ? ' active' : ''}`}
              aria-pressed={win === w}
              onClick={() => setWin(w)}
            >
              {WINDOW_LABELS[w]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="lb-skeletons">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton lb-skeleton-row" />
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="alert-info">No data yet for this period. Start reviewing to earn XP!</div>
        )}

        {!loading && podium.length > 0 && (
          <>
            <div className="section-title">Top 3</div>
            <div className="lb-podium">
              {PODIUM_SIZES.map((entryIdx) => {
                const entry = podium[entryIdx]
                if (!entry) return <div key={entryIdx} className="lb-podium-gap" />
                const isFirst = entry.rank === 1
                const rank = getRankForXP(entry.points)
                return (
                  <div
                    key={entry.user_id}
                    className={`lb-podium-card${isFirst ? ' is-first' : ''}`}
                    style={{ '--medal': PODIUM_COLORS[entry.rank - 1] } as React.CSSProperties}
                  >
                    <div className="lb-podium-rank">{entry.rank}</div>
                    <UserAvatar displayName={entry.display_name} isMe={entry.is_me} size={isFirst ? 44 : 36} />
                    <div className="lb-podium-name">
                      {entry.display_name?.split(' ')[0] ?? (entry.is_me ? 'You' : '—')}
                    </div>
                    <div className="lb-podium-xp">{entry.points.toLocaleString()}</div>
                    <div className="lb-unit">XP</div>
                    <span className="rank-badge lb-rank-badge" style={{ color: rank.color, background: `${rank.color}18` }}>
                      {rank.icon} {rank.label}
                    </span>
                    {entry.streak !== undefined && entry.streak > 0 && (
                      <div className="lb-streak">
                        <FlameIcon size={11} /> {entry.streak}d streak
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {rest.length > 0 && (
              <>
                <div className="section-title">Rankings</div>
                <div className="lb-rows">
                  {rest.map((entry) => {
                    const rank = getRankForXP(entry.points)
                    return (
                      <div key={entry.user_id} className={`lb-row${entry.is_me ? ' is-me' : ''}`}>
                        <span className="lb-row-rank">#{entry.rank}</span>
                        <UserAvatar displayName={entry.display_name} isMe={entry.is_me} />
                        <div className="lb-row-body">
                          <div className="lb-row-name">{entry.display_name?.trim() || '—'}</div>
                          <div className="lb-row-rank-label" style={{ color: rank.color }}>
                            {rank.icon} {rank.label}
                          </div>
                        </div>
                        <div className="lb-row-score">
                          <div className="lb-row-xp">{entry.points.toLocaleString()}</div>
                          <div className="lb-unit">XP</div>
                        </div>
                        {entry.streak !== undefined && entry.streak > 0 && (
                          <div className="lb-streak lb-row-streak">
                            <FlameIcon size={12} /> {entry.streak}
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
      </div>

      <ProfileSidePanel />
    </div>
  )
}
