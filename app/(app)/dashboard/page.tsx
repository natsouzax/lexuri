'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import type { Rank, XPProgressInfo, Mission } from '@/lib/gamification'

interface MissionProgress extends Mission {
  progress: number
  completed: boolean
}

interface XPEvent {
  event_type: string
  points: number
  event_ts: string
}

interface StatsData {
  points: number
  streak: number
  total_reviews: number
  rank: Rank
  xpProgress: XPProgressInfo
  missionsToday: MissionProgress[]
  weekActivity: boolean[]
  xpHistory: XPEvent[]
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const data = await res.json()
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  return data as T
}

const EVENT_LABELS: Record<string, string> = {
  flashcard_review: 'Reviewed a flashcard',
  chunk_analyzed:   'Analyzed language chunks',
  chunk_saved:      'Saved a language chunk',
  video_studied:    'Studied a YouTube video',
  music_studied:    'Music Lab session',
  word_looked_up:   'Looked up a word',
  streak_bonus:     'Streak bonus',
  mission_complete: 'Completed a mission',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      const name: string = meta?.full_name ?? data.user?.email?.split('@')[0] ?? 'there'
      setUsername(name.split(' ')[0])
    })

    apiFetch<StatsData>('/api/gamification/stats')
      .then(setStats)
      .catch(() => {/* silent — show skeleton */})
      .finally(() => setLoading(false))
  }, [])

  const rank = stats?.rank
  const xp = stats?.xpProgress

  return (
    <>
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="app-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <p className="app-hero-subtitle" style={{ marginBottom: 6 }}>
              {greeting()}, {username || '…'}
            </p>
            <h1 className="app-hero-title">Your Dashboard</h1>
          </div>
          {rank ? (
            <div
              className="rank-badge"
              style={{ background: rank.color + '22', color: rank.color, border: `1px solid ${rank.color}55`, fontSize: '0.85rem', padding: '6px 16px' }}
            >
              <span>{rank.icon}</span>
              <span>{rank.label}</span>
            </div>
          ) : (
            <div className="skeleton" style={{ width: 90, height: 32, borderRadius: 999 }} />
          )}
        </div>

        {/* XP progress bar */}
        {xp ? (
          <div style={{ maxWidth: 520 }}>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xp.progressPct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--dark-muted)', fontWeight: 700 }}>
                {stats!.points.toLocaleString()} XP
              </span>
              {xp.nextRank ? (
                <span style={{ fontSize: '0.72rem', color: 'var(--dark-muted)' }}>
                  +{xp.xpToNext?.toLocaleString()} to {xp.nextRank.label}
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--clay-bright)' }}>Max rank reached</span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="skeleton" style={{ height: 6, borderRadius: 99, maxWidth: 520, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: 200 }} />
          </div>
        )}

        {/* Streak */}
        {stats && stats.streak > 0 && (
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(200,111,74,0.18)', borderRadius: 999, padding: '5px 14px' }}>
            <span style={{ color: 'var(--clay-bright)', fontWeight: 900, fontSize: '0.88rem' }}>◆</span>
            <span style={{ color: 'var(--paper)', fontWeight: 700, fontSize: '0.82rem' }}>
              {stats.streak} day streak
            </span>
          </div>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────── */}
      <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 8 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card">
              <div className="skeleton" style={{ height: 36, width: 80, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: 60 }} />
            </div>
          ))
        ) : (
          <>
            <div className="metric-card">
              <div className="metric-value" style={{ color: rank?.color }}>{stats?.points.toLocaleString() ?? 0}</div>
              <div className="metric-label">Total XP</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{stats?.streak ?? 0}</div>
              <div className="metric-label">Day streak</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{stats?.total_reviews ?? 0}</div>
              <div className="metric-label">Cards reviewed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value" style={{ fontSize: '1.4rem', color: rank?.color }}>{rank?.icon} {rank?.label}</div>
              <div className="metric-label">Current rank</div>
            </div>
          </>
        )}
      </div>

      {/* ── Missions + Calendar ───────────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 8 }}>

        {/* Daily missions */}
        <div style={{ flex: '1 1 55%', minWidth: 280 }}>
          <div className="section-title">Today's Missions</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="mission-card">
                  <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(stats?.missionsToday ?? []).map((m) => (
                <div key={m.id} className={`mission-card${m.completed ? ' completed' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: m.completed ? 'rgba(70,98,74,0.15)' : 'rgba(200,111,74,0.1)',
                        color: m.completed ? 'var(--moss)' : 'var(--clay)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', flexShrink: 0,
                        fontWeight: 900,
                      }}>
                        {m.completed ? '✓' : m.icon}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: 1 }}>
                          {m.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {m.description}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      flexShrink: 0,
                      fontSize: '0.72rem', fontWeight: 900,
                      padding: '3px 10px', borderRadius: 999,
                      background: m.completed ? 'rgba(70,98,74,0.15)' : 'rgba(200,111,74,0.1)',
                      color: m.completed ? 'var(--moss)' : 'var(--clay)',
                      whiteSpace: 'nowrap',
                    }}>
                      {m.completed ? '✓' : '+'}{m.xpReward} XP
                    </div>
                  </div>

                  {/* Progress bar (only for multi-step missions) */}
                  {m.targetCount > 1 && !m.completed && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                          {m.progress} / {m.targetCount}
                        </span>
                      </div>
                      <div className="xp-bar-track-light">
                        <div
                          className="xp-bar-fill"
                          style={{ width: `${Math.round((m.progress / m.targetCount) * 100)}%`, background: 'var(--moss)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly calendar */}
        <div style={{ flex: '1 1 35%', minWidth: 220 }}>
          <div className="section-title">This Week</div>
          {loading ? (
            <div className="skeleton" style={{ height: 90, borderRadius: 14 }} />
          ) : (
            <WeeklyCalendar weekActivity={stats?.weekActivity ?? Array(7).fill(false)} />
          )}

          {/* Compact XP breakdown below calendar */}
          {stats && (
            <div style={{ marginTop: 12, background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                XP this week
              </div>
              {stats.xpProgress.xpIntoRank > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Progress to {stats.xpProgress.rank.label}</span>
                  <span style={{ fontWeight: 900, fontSize: '0.88rem', color: stats.rank.color }}>
                    {stats.xpProgress.progressPct}%
                  </span>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <div className="xp-bar-track-light">
                  <div className="xp-bar-fill" style={{ width: `${stats.xpProgress.progressPct}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick start ───────────────────────────────── */}
      <div className="section-title">Quick Start</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 8 }}>
        <Link href="/youtube" className="quick-action-card">
          <span style={{ fontSize: '1.6rem', color: 'var(--clay-bright)' }}>▶</span>
          <div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', marginBottom: 3 }}>YouTube Studio</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dark-muted)' }}>Load a video, extract chunks</div>
          </div>
        </Link>
        <Link href="/music" className="quick-action-card">
          <span style={{ fontSize: '1.6rem', color: 'var(--clay-bright)' }}>♪</span>
          <div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', marginBottom: 3 }}>Music Lab</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dark-muted)' }}>Learn from songs you love</div>
          </div>
        </Link>
        <Link href="/review" className="quick-action-card">
          <span style={{ fontSize: '1.6rem', color: 'var(--clay-bright)' }}>↺</span>
          <div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', marginBottom: 3 }}>Review</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--dark-muted)' }}>Spaced repetition session</div>
          </div>
        </Link>
      </div>

      {/* ── XP History ────────────────────────────────── */}
      {(stats?.xpHistory.length ?? 0) > 0 && (
        <>
          <div className="section-title">Recent Activity</div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '4px 20px', boxShadow: 'var(--shadow-sm)' }}>
            {stats!.xpHistory.map((evt, i) => (
              <div key={i} className="xp-history-row">
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(200,111,74,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', color: 'var(--clay)',
                }}>
                  {evt.event_type === 'flashcard_review' ? '↺'
                    : evt.event_type === 'chunk_analyzed' ? '⚡'
                    : evt.event_type === 'chunk_saved'    ? '◈'
                    : evt.event_type === 'video_studied'  ? '▶'
                    : evt.event_type === 'music_studied'  ? '♪'
                    : evt.event_type === 'word_looked_up' ? '◉'
                    : evt.event_type === 'streak_bonus'   ? '◆'
                    : '★'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {EVENT_LABELS[evt.event_type] ?? evt.event_type}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {timeAgo(evt.event_ts)}
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--moss)', flexShrink: 0 }}>
                  +{evt.points} XP
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
