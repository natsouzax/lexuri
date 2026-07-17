import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { category, message, email, rating } = await req.json()
    if (!category || !message?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const RATING_LABELS: Record<number, string> = { 1: '😕 Not great', 2: '😐 Meh', 3: '🙂 Good', 4: '😊 Great', 5: '🤩 Amazing!' }
    const ratingLine = rating ? `Rating: ${RATING_LABELS[rating] ?? rating}/5` : 'Rating: not provided'

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'Lexuri <onboarding@resend.dev>',
        to: 'natanoliveiraad855@gmail.com',
        subject: `[Lexuri Feedback] ${category}`,
        text: [
          `Category: ${category}`,
          ratingLine,
          `From: ${email || 'anonymous'}`,
          '',
          message,
        ].join('\n'),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
