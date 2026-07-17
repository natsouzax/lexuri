import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { question, userAnswer, targetLevel } = await request.json() as {
      question: string
      userAnswer: string
      targetLevel: string
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Grade a student's English fill-in-the-blank answer. Be strict but fair.

Return JSON:
{
  "grade": "correct" | "partial" | "wrong",
  "correctAnswer": "the ideal answer",
  "feedback": "one concise sentence explaining the grade or the correct grammar rule"
}

Rules:
- "correct": answer is grammatically correct and semantically appropriate
- "partial": answer shows understanding but has minor errors or uses an acceptable alternative
- "wrong": incorrect grammar or wrong verb form
- Keep feedback very concise (under 20 words)`,
        },
        {
          role: 'user',
          content: `Target CEFR level: ${targetLevel}\nQuestion/sentence: ${question}\nStudent answer: "${userAnswer}"`,
        },
      ],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    return NextResponse.json(JSON.parse(raw))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
