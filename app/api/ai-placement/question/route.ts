import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI()

interface HistoryEntry {
  question: string
  userAnswer: string
  grade: 'correct' | 'partial' | 'wrong'
  targetLevel: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { history = [], roundNumber = 1 } = await request.json() as {
      history: HistoryEntry[]
      roundNumber: number
    }

    const historyText = history.length
      ? history.map((h, i) =>
          `Round ${i + 1} [${h.targetLevel}]: "${h.question}" → "${h.userAnswer}" → ${h.grade}`
        ).join('\n')
      : '(first question)'

    const correct = history.filter((h) => h.grade === 'correct').length
    const wrong   = history.filter((h) => h.grade === 'wrong').length

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an adaptive English placement test AI. Your job is to assess a student's CEFR level (A1–C2) through targeted grammar and vocabulary questions.

RULES:
- Adapt difficulty in real time: if the last answer was wrong, go 1 level easier; if correct, go 1 level harder
- Default starting level: B1 for round 1
- Question types rotate: use "multiple_choice" (4 options) for odd rounds, "fill_in" (complete the sentence) for even rounds
- Never test the same grammar topic twice (check history)
- Questions must test real usage, not definitions: conditionals, tense sequences, modals, collocations, prepositions, reported speech, inversion, etc.
- Make questions feel natural and interesting (not textbook-dry)

RESPONSE (when still testing, round < 9):
{
  "question": "...",
  "type": "multiple_choice" | "fill_in",
  "options": ["A", "B", "C", "D"],
  "correctOptionIndex": 0,
  "targetLevel": "B1",
  "done": false
}

Note: for "fill_in" type, still include "options" and "correctOptionIndex" (the correct fill-in text as the only option at index 0, others are plausible wrong answers — for display purposes only after answer).

RESPONSE (when done — round >= 9 OR score pattern is clear):
{
  "done": true,
  "result": {
    "level": "B1",
    "confidence": 0.82,
    "strengths": ["present perfect", "modal verbs"],
    "weaknesses": ["third conditional", "passive voice"],
    "summary": "You have a solid B1 foundation with good control of basic tenses and modals, but complex conditional structures and passive constructions need more practice."
  }
}`,
        },
        {
          role: 'user',
          content: `Round: ${roundNumber}/8\nScore: ${correct} correct, ${wrong} wrong\nHistory:\n${historyText}`,
        },
      ],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
