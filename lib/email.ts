import { Resend } from 'resend'
import type { ReactElement } from 'react'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export async function sendEmail(
  to: string,
  subject: string,
  react: ReactElement,
): Promise<void> {
  try {
    await getResend().emails.send({
      from: 'Verbly <onboarding@resend.dev>',
      to,
      subject,
      react,
    })
  } catch {
    // email is fire-and-forget — never crashes the caller
  }
}
