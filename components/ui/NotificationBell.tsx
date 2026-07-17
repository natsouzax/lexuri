'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface Notification {
  id: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen]   = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  // Load initial notifications and subscribe to realtime
  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (mounted) setNotifications((data ?? []) as Notification[])

      // Realtime subscription
      supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload: RealtimePostgresInsertPayload<Notification>) => {
            setNotifications(prev => [payload.new, ...prev])
          },
        )
        .subscribe()
    }

    init()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unread = notifications.filter(n => !n.read).length

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications/all/read', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  if (!userId) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'red', color: '#fff', borderRadius: '50%',
            fontSize: '0.6rem', width: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 36, width: 320, maxHeight: 400,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,.12)', overflowY: 'auto', zIndex: 1000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #eee' }}>
            <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p style={{ padding: 16, color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
              No notifications yet.
            </p>
          )}

          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid #f0f0f0',
                background: n.read ? '#fff' : '#f0f7ff',
                cursor: n.read ? 'default' : 'pointer',
              }}
            >
              <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.85rem' }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '0.78rem', color: '#555', marginTop: 2 }}>{n.body}</div>}
              <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
