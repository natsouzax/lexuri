import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('native_language')
      .eq('user_id', user.id)
      .single()
    const nativeLang: string = (onboarding as { native_language?: string } | null)?.native_language ?? 'Portuguese'

    const { level, weaknesses = [], strengths = [] } = await request.json() as {
      level: string
      weaknesses: string[]
      strengths: string[]
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.85,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a personalized English curriculum designer. Generate a study starter pack for an English learner.

Student profile:
- CEFR level: ${level}
- Native language: ${nativeLang}
- Strengths: ${strengths.join(', ') || 'none identified yet'}
- Weaknesses: ${weaknesses.join(', ') || 'general practice needed'}

Generate a complete JSON study pack with this exact structure:
{
  "flashcards": [
    {
      "front": "English word or grammar structure",
      "back": "meaning / translation in ${nativeLang}",
      "example": "natural example sentence in English",
      "level": "${level}"
    }
  ],
  "chunks": [
    {
      "text": "the natural expression (phrasal verb / idiom / collocation)",
      "type": "phrasal_verb | idiomatic | collocation | lexical_chunk | grammar_pattern",
      "translation": "meaning in ${nativeLang}",
      "explanation": "brief usage note in ${nativeLang}",
      "example": "example sentence in English",
      "importance": "high | medium"
    }
  ],
  "roadmap": [
    {
      "week": 1,
      "focus": "topic focus for this week",
      "activities": ["specific activity 1", "specific activity 2", "specific activity 3"]
    }
  ],
  "suggestions": [
    {
      "type": "youtube | music",
      "query": "search query the student should use",
      "reason": "why this content helps for ${level} learners (in ${nativeLang})"
    }
  ]
}

Requirements:
- 10 flashcards: 6 vocabulary + 4 grammar patterns, focused on the student's weaknesses
- 7 language chunks: real natural expressions used by native speakers at ${level} level
- 4-week roadmap: progressive, practical, references Lexuri features (Music Lab, YouTube Studio, flashcard review)
- 3 content suggestions: 2 YouTube topics, 1 Music artist/song genre — realistic and specific
- flashcard "back" and chunk "translation"/"explanation" MUST be in ${nativeLang}
- roadmap "activities" should be in English
- Be specific, not generic — avoid placeholder text`,
        },
        {
          role: 'user',
          content: `Generate the study pack for a ${level} learner (native: ${nativeLang}).`,
        },
      ],
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const pack = JSON.parse(raw)
    return NextResponse.json(pack)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
