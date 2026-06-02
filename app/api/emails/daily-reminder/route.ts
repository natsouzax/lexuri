import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { trackServer } from '@/lib/analytics'
import DailyReviewEmail from '@/lib/emails/daily-review'
import { createElement } from 'react'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://verbly.app'
  const reviewUrl = `${appUrl}/review`

  // Fetch flashcards due for review
  const { data: dueCards, error: cardsError } = await admin
    .from('flashcards')
    .select('user_id')
    .lte('next_review', new Date().toISOString())

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 })
  }

  // Group by user_id and count
  const cardsByUser: Record<string, number> = {}
  for (const row of dueCards ?? []) {
    cardsByUser[row.user_id] = (cardsByUser[row.user_id] ?? 0) + 1
  }

  const userIds = Object.keys(cardsByUser)
  if (!userIds.length) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // Fetch profiles to check email_reminders flag
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email_reminders')
    .in('id', userIds)

  const remindersEnabled = new Set(
    (profiles ?? [])
      .filter((p) => p.email_reminders !== false)
      .map((p) => p.id),
  )

  // Only fetch emails for users who have reminders enabled (skips orphan user_ids)
  const emailByUserId: Record<string, string> = {}
  await Promise.all(
    userIds
      .filter((id) => remindersEnabled.has(id))
      .map(async (userId) => {
        try {
          const { data } = await admin.auth.admin.getUserById(userId)
          if (data.user?.email) emailByUserId[userId] = data.user.email
        } catch {
          // user not found in auth — skip silently
        }
      }),
  )

  let sent = 0
  let skipped = 0

  for (const userId of userIds) {
    const email = emailByUserId[userId]
    if (!email || !remindersEnabled.has(userId)) {
      skipped++
      continue
    }

    const cardsDue = cardsByUser[userId]
    await sendEmail(
      email,
      `Você tem ${cardsDue} ${cardsDue === 1 ? 'flashcard' : 'flashcards'} para revisar hoje`,
      createElement(DailyReviewEmail, { cardsDue, reviewUrl }),
    )
    await trackServer(admin, userId, 'daily_reminder_sent', { cards_due: cardsDue })
    sent++
  }

  return NextResponse.json({ sent, skipped })
}
