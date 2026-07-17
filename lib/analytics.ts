/**
 * Client-side analytics — fire-and-forget, never throws.
 * Server-side use: trackServer() from server components / API routes.
 */

export type AnalyticsEventName =
  | 'flashcard_review'
  | 'session_start'
  | 'session_end'
  | 'payment_complete'
  | 'video_sync_play'
  | 'chunk_detected'
  | 'flashcard_created'
  | 'daily_reminder_sent'

export type EventPayload = Record<string, string | number | boolean | null | undefined>

/** Browser-side: posts to /api/analytics/track (non-blocking). */
export function track(event: AnalyticsEventName, payload?: EventPayload): void {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload: payload ?? {} }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // analytics must never crash the app
  }
}

/** Server-side: import this in API routes or server components. */
export async function trackServer(
  supabaseAdmin: import('@supabase/supabase-js').SupabaseClient,
  userId: string,
  event: AnalyticsEventName,
  payload?: EventPayload,
): Promise<void> {
  try {
    await supabaseAdmin.from('analytics_events').insert({
      user_id: userId,
      event_name: event,
      payload: payload ?? {},
    })
  } catch {
    // analytics must never crash the app
  }
}
